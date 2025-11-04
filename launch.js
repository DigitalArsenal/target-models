import csvParser from 'csv-parser';
import fs, { writeFileSync } from 'fs';
import axios from 'axios';
import cheerio from 'cheerio';
import { SITT, SiteType, SITCOLLECTIONT } from "./lib/SIT/main.js";
import xxhash from "xxhashjs";

const parseSignedCoordinate = (value) => {
    if (typeof value === 'number') {
        return value;
    }

    if (!value) {
        return NaN;
    }

    const trimmed = String(value).trim();
    if (!trimmed) {
        return NaN;
    }

    const match = trimmed.match(/^(-?\d+(?:\.\d+)?)(?:\s*[°º]?)\s*([NSEW])?$/i);
    if (match) {
        const magnitude = parseFloat(match[1]);
        if (!Number.isFinite(magnitude)) {
            return NaN;
        }

        const direction = match[2]?.toUpperCase();
        if (direction === 'S' || direction === 'W') {
            return -Math.abs(magnitude);
        }
        return Math.abs(magnitude);
    }

    const numericValue = parseFloat(trimmed);
    return Number.isFinite(numericValue) ? numericValue : NaN;
};

const safeParseCoordinatePair = (latitudeRaw, longitudeRaw) => {
    const latitude = parseSignedCoordinate(latitudeRaw);
    const longitude = parseSignedCoordinate(longitudeRaw);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        return null;
    }
    return [longitude, latitude];
};

// Function to parse CSV data and convert it to GeoJSON
const parseCsvToGeoJson = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (data) => {
                const { Name, Country, Latitude, Longitude } = data;
                const coordinates = safeParseCoordinatePair(Latitude, Longitude);
                if (!coordinates) {
                    console.warn(`Skipping launch site with invalid coordinates: ${Name || 'Unknown'}`);
                    return;
                }

                //console.log(Name, Country, Latitude, Longitude)
                results.push({
                    type: 'Feature',
                    properties: { Name, Country },
                    geometry: {
                        type: 'Point',
                        coordinates
                    }
                });
            })
            .on('end', () => {
                resolve({
                    type: 'FeatureCollection',
                    features: results
                });
            })
            .on('error', reject);
    });
};

// Function to parse JSON data and convert it to GeoJSON
const parseJsonToGeoJson = (filePath) => {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(fileContent);
    const features = [];
    for (let i = 0; i < jsonData.length; i++) {
        const { "Facility Name": name, latitude, longitude } = jsonData[i];
        features.push({
            type: 'Feature',
            properties: { name },
            geometry: {
                type: 'Point',
                coordinates: [longitude, latitude]
            }
        })
    }
    return {
        type: 'FeatureCollection',
        features
    };
};

// Example usage
const csvFilePath = 'raw/launchsites.csv';
const jsonFilePath = 'raw/json/slc.json';

const siteCollectionLaunch = new SITCOLLECTIONT();

parseCsvToGeoJson(csvFilePath).then(geoJsonFromCsv => {
    writeFileSync(`./data/launchsites.geojson.json`, JSON.stringify(geoJsonFromCsv, null, 4))
});

const geoJsonFromJson = parseJsonToGeoJson(jsonFilePath);
writeFileSync(`./data/slc.geojson.json`, JSON.stringify(geoJsonFromJson, null, 4))



const url = 'https://en.wikipedia.org/wiki/List_of_rocket_launch_sites';

const fetchLaunchSites = async () => {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:128.0) Gecko/20100101 Firefox/128.0',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });
        const $ = cheerio.load(response.data);
        const launchSites = [];

        $('table.wikitable tbody tr').each((index, element) => {
            const tds = $(element).find('td');
            if (tds.length > 0) {
                const location = $(tds[0]).text().trim();
                const name = $(tds[1]).text().trim();
                const coordinatesText = $(tds[2]).text().trim();

                const coordinatePattern = /(\d+\.\d+)(°[NS])\s+(\d+\.\d+)(°[EW])/;
                const match = coordinatesText.match(coordinatePattern);

                if (match) {
                    const latitude = parseFloat(match[1]) * (match[2] === '°N' ? 1 : -1);
                    const longitude = parseFloat(match[3]) * (match[4] === '°E' ? 1 : -1);

                    launchSites.push({
                        type: "Feature",
                        properties: {
                            name,
                            location
                        },
                        geometry: {
                            type: "Point",
                            coordinates: [longitude, latitude]
                        }
                    });

                    let sitt = new SITT();
                    sitt.LATITUDE = latitude;
                    sitt.LONGITUDE = longitude;
                    sitt.ID = xxhash.h32(name, 0xBEEF).toString(16).toUpperCase();
                    sitt.NAME = name;
                    sitt.CREATED_BY = "https://en.wikipedia.org/wiki/List_of_rocket_launch_sites";
                    sitt.SITE_TYPE = SiteType.LAUNCH_SITE;
                    siteCollectionLaunch.RECORDS.push(sitt);
                }
            }
        });

        return [launchSites, siteCollectionLaunch];
    } catch (error) {
        console.error('Error fetching launch sites:', error);
        return [[], siteCollectionLaunch];
    }
};

const convertToGeoJSON = async () => {
    const result = await fetchLaunchSites();
    if (!result) {
        return [null, null];
    }

    const [geoJSON, sittcollection] = result;
    return [{
        type: "FeatureCollection",
        features: geoJSON
    }, { SITCOLLECTION: sittcollection }];
};

const replacer = (key, value) => {
    if (value === null || value === '') {
        return undefined; // Return undefined to exclude property
    }
    return value;
};

convertToGeoJSON().then(([geoJSON, sittcollection]) => {

    if (geoJSON) {
        fs.writeFileSync('./data/wikijson.json', JSON.stringify(geoJSON, null, 2));
    }

    if (sittcollection) {
        fs.writeFileSync('./data/sitcollection.json', JSON.stringify(sittcollection, replacer, 2));
    }
}).catch((error) => {
    console.error('Failed to convert launch site data to GeoJSON', error);
});
