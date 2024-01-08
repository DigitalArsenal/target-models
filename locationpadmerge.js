import fs from "fs";

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

//console.log(JSON.stringify(launchByPad, null, 4));

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
    const combinedData = locationsData.map(location => {
        const matchingPads = padsData.filter(pad => pad.location.id === location.id);
        delete location.timezone_name;
        delete location.url;
        delete location.description;
        delete location.map_image;
        location.name = location.name.split(",")[0].trim();

        return {
            ...location,
            pads: matchingPads.map(pad => ({
                id: pad.id,
                name: pad.name,
                latitude: pad.latitude,
                longitude: pad.longitude,
                total_launch_count: pad.total_launch_count,
                orbital_launch_attempt_count: pad.orbital_launch_attempt_count,
                launches: launchByPad[pad.id]
            }))
        };
    });

    const locationJSON = JSON.stringify(combinedData, null, 2);
    fs.writeFileSync("./data/thespacedevs/locations.combined.json", locationJSON);
}
