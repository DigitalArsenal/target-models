import fs from "fs";
import { SITT, SiteType, SITCOLLECTIONT } from "./lib/SIT/main.js";
import xxhash from "xxhashjs";

const readJSONFile = (filePath) => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading JSON file ${filePath}: ${error.message}`);
        return null;
    }
};

const locationsData = readJSONFile('./data/thespacedevs/locations.json');
const padsData = readJSONFile('./data/thespacedevs/pads.json');
const launchData = readJSONFile('./data/thespacedevs/launches.json');

const launchByPad = {};
for (let l = 0; l < launchData.length; l++) {
    launchByPad[launchData[l].pad.id] = launchByPad[launchData[l].pad.id] || [];
    let ll = JSON.parse(JSON.stringify(launchData[l])); // Deep copy of launchData[l]
    ll.epoch = ll.net;
    recursivelyRemoveProperties(ll, [
        'url',
        'id',
        'infographic',
        'image',
        'webcast_live',
        'map_image',
        'pad',
        'holdreason',
        'failreason',
        'hashtag',
        'weather_concerns',
        'probability',
        'slug',
        'orbital_launch_attempt_count_year',
        'location_launch_attempt_count_year',
        'pad_launch_attempt_count_year',
        'agency_launch_attempt_count_year',
        'pad_launch_attempt_count',
        'location_launch_attempt_count',
        'orbital_launch_attempt_count',
        'agency_launch_attempt_count',
        'info_urls',
        'vid_urls',
        'status',
        'last_updated',
        'net_precision',
        'window_start',
        'window_end',
        'image_url',
        'start_date',
        'mission_patches',
        'full_name',
        'launch_library_url',
        'total',
        'net'
    ]);

    launchByPad[launchData[l].pad.id].push(ll);
}

function recursivelyRemoveProperties(obj, propertiesToRemove) {
    if (typeof obj !== 'object' || obj === null) {
        return;
    }

    for (const property in obj) {
        if (propertiesToRemove.includes(property)) {
            delete obj[property];
        } else {
            recursivelyRemoveProperties(obj[property], propertiesToRemove);
        }
    }
}

if (locationsData && padsData) {
    // Combine the data and perform the desired operation here
    const combinedData = locationsData.filter(location => {
        return padsData.filter(pad => pad.location.id === location.id).length > 0
    }).map(location => {
        const matchingPads = padsData.filter(pad => pad.location.id === location.id);
        delete location.timezone_name;
        delete location.url;
        delete location.description;
        delete location.map_image;
        location.name = location.name.split(",")[0].trim();

        // Calculate the average latitude and longitude for pad locations
        let totalLatitude = 0;
        let totalLongitude = 0;
        matchingPads.forEach(pad => {
            totalLatitude += pad.latitude ? parseFloat(pad.latitude) : 0;
            totalLongitude += pad.longitude ? parseFloat(pad.longitude) : 0;
        });

        const averageLatitude = matchingPads.length > 0 ? totalLatitude / matchingPads.length : null;
        const averageLongitude = matchingPads.length > 0 ? totalLongitude / matchingPads.length : null;

        return {
            ...location,
            pads: matchingPads.map(pad => ({
                id: pad.id,
                name: pad.name,
                latitude: parseFloat(pad.latitude) || averageLatitude,
                longitude: parseFloat(pad.longitude) || averageLongitude,
                total_launch_count: pad.total_launch_count,
                orbital_launch_attempt_count: pad.orbital_launch_attempt_count,
                launches: launchByPad[pad.id]
            })),
            LATITUDE: averageLatitude,
            LONGITUDE: averageLongitude
        };
    });

    const locationJSON = JSON.stringify(combinedData, null, 2);
    fs.writeFileSync("./data/thespacedevs/locations.combined.json", locationJSON);

    // Create SIT records
    const sitCollection = new SITCOLLECTIONT();
    combinedData.forEach(location => {
        sitCollection.RECORDS.push(createSIT(location));
    });

    const sitJSON = JSON.stringify({ SITCOLLECTION: sitCollection }, null, 2);
    fs.writeFileSync("./data/thespacedevs/launch.sit.json", sitJSON);
}

function createSIT(launchSite) {
    const sit = new SITT();
    sit.ID = xxhash.h32(launchSite.name, 0xABCD).toString(16);
    sit.NAME = launchSite.name;
    sit.ABBREVIATION = launchSite.name; // Replace with the appropriate abbreviation logic
    sit.SITE_TYPE = SiteType.LAUNCH_SITE; // Set SITE_TYPE to 'LAUNCH_SITE'
    sit.LATITUDE = launchSite.LATITUDE; // Convert latitude to float
    sit.LONGITUDE = launchSite.LONGITUDE; // Convert longitude to float
    sit.pads = launchSite.pads;
    // Remove null or empty properties
    for (let x in sit) {
        if (sit[x] === null || (Array.isArray(sit[x]) && sit[x].length === 0)) {
            delete sit[x];
        }
    }

    return sit;
}
