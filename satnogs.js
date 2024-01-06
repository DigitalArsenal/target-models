
import fetch from "node-fetch";
import { writeFileSync } from "fs";
import satnogs_sites from "./data/satnogs/stations.json" assert {type: "json"};
import { IDM, SIT, SiteType, SITCOLLECTION } from "./lib/SIT/main.js";
import xxhash from "xxhashjs";

async function fetchCurrentStations() {
    let response = await fetch("https://network.satnogs.org/stations_all/", {
        "headers": {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9",
            "cache-control": "no-cache",
            "pragma": "no-cache",
            "sec-ch-ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Brave\";v=\"120\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Linux\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "sec-gpc": "1",
            "x-requested-with": "XMLHttpRequest",
            "Referer": "https://network.satnogs.org/",
            "Referrer-Policy": "same-origin"
        },
        "body": null,
        "method": "GET"
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}


function createIntegratedDevice(antenna, station) {
    return {
        //ID: xxhash.h32(`ANT-${station.id}-${antenna.antenna_type_name}`, 0xABCD).toString(16),
        NAME: antenna.antenna_type_name,
        //DATA_MODE: 'REAL', // Assuming real data mode
        BAND: [{
            NAME: antenna.band,
            FREQUENCY_RANGE: {
                LOWER: antenna.frequency,
                UPPER: antenna.frequency_max
            }
        }],
        TRANSMIT: false, // Assuming it can transmit
        RECEIVE: true, // Assuming it can receive
    };
}

function mapStationToSIT(station) {
    let integratedDevices = [];

    if (Array.isArray(station.antenna)) {
        integratedDevices = station.antenna.map(antenna => createIntegratedDevice(antenna, station));
    }
    if (!station.id) {
        console.log(station)
    }
    return {
        ID: station.id.toString(),
        NAME: station.name,
        //SITE_TYPE: 'OBSERVATION_STATION', // Defaulting to observation station
        NETWORK: 'SatNOGS',
        LATITUDE: station.lat,
        LONGITUDE: station.lng,
        ALTITUDE: station.altitude,
        //CENTER_POINT_GEOMETRY: [station.lng, station.lat],
        //DESCRIPTION: station.description || '',
        //TASKABLE: false, // Assuming the site is not taskable
        OPERATIONAL_STATUS: station.status,
        INTEGRATED_DEVICES: integratedDevices
    };
}

async function fetchStationDetails(stationId) {
    const url = `https://network.satnogs.org/api/stations/?format=json&id=${stationId}`;
    let response = await fetch(url);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(data)
    return data[0]; // Assuming the API returns an array and we need the first element
}

async function updateStations() {
    const existingStationIds = new Set(satnogs_sites.map(station => station.id.toString()));
    const currentStations = await fetchCurrentStations();

    let stationsToUpdate = [];

    for (const station of currentStations) {
        if (!existingStationIds.has(station.id.toString())) {
            const detailedStation = await fetchStationDetails(station.id);
            stationsToUpdate.push(detailedStation);
        }
    }

    console.log(stationsToUpdate.length);

    if (stationsToUpdate.length > 0) {
        satnogs_sites.push(...stationsToUpdate);
        writeFileSync('./data/satnogs/stations.json', JSON.stringify(satnogs_sites, null, 4));
    }

    return satnogs_sites;
}

function convertToSITFormat(stations) {
    const sitStations = [...stations].map(station => mapStationToSIT(station));
    const sitCollection = {
        RECORDS: sitStations
    };
    return sitCollection;
}

async function main() {
    try {
        const updatedStations = await updateStations();
        const sitData = convertToSITFormat(updatedStations);
        writeFileSync('./data/satnogs.sit.json', JSON.stringify(sitData, null, 4));
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

main();