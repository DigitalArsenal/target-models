import csvParser from 'csv-parser';
import fs, { writeFileSync } from 'fs';

// Function to parse CSV data and convert it to GeoJSON
const parseCsvToGeoJson = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (data) => {
                const { Name, Country, Latitude, Longitude } = data;
                //console.log(Name, Country, Latitude, Longitude)
                results.push({
                    type: 'Feature',
                    properties: { Name, Country },
                    geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(Longitude), parseFloat(Latitude)]
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
    console.log(jsonData);
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

parseCsvToGeoJson(csvFilePath).then(geoJsonFromCsv => {
    writeFileSync(`./data/launchsites.geojson.json`, JSON.stringify(geoJsonFromCsv, null, 4))
});

const geoJsonFromJson = parseJsonToGeoJson(jsonFilePath);
writeFileSync(`./data/slc.geojson.json`, JSON.stringify(geoJsonFromJson, null, 4))
