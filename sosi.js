import { writeFileSync, readFileSync } from 'fs';
import { SITT, SiteType, SITCOLLECTIONT } from "./lib/SIT/main.js";
import { IDM, DeviceType, IDMCOLLECTIONT, DataMode } from "./lib/IDM/main.js";
import xxhash from "xxhashjs";
import { sensors as devices } from "./raw/sensors.js";
import CTRC from "./data/ctr_collection.json" assert {type: "json"};
import HOBBYISTS from "./raw/json/hobby_sosi.json" assert {type: "json"};
import PRCSOSI from "./raw/json/prc_sosi.json" assert {type: "json"};
import { deviceTypeMap } from "./deviceMap.js";

function idExistsInCollection(id, collection) {
    return collection.RECORDS.some(record => record.ID === id);
}

function createSIT(device) {
    const sit = new SITT();
    sit.ID = xxhash.h32(device.name, 0xABCD).toString(16);
    sit.NAME = device.name;
    sit.ABBREVIATION = device.objName;
    sit.SITE_TYPE = determineSiteType(device.type);
    sit.LATITUDE = device.lat;
    sit.LONGITUDE = device.lon;
    sit.ALTITUDE = device.alt;

    for (let c = 0; c < CTRC.CTRCOLLECTION.RECORDS.length; c++) {
        if (~JSON.stringify(CTRC.CTRCOLLECTION.RECORDS[c]).toLowerCase().indexOf(device.country.toLowerCase())) {
            sit.CTR_ID = CTRC.CTRCOLLECTION.RECORDS[c].ID;
        } else if (CTRC.CTRCOLLECTION.RECORDS[c].ID === "036" && device.country === "Australia") {
            console.log(JSON.stringify(CTRC.CTRCOLLECTION.RECORDS[c]).toLowerCase(), device.country.toLowerCase());
        }
    }
    if (!sit.CTR_ID) {
        if (device.country === "Australia") {
            sit.CTR_ID = "036";
        } else {
            console.error(`${device.country} not found`)
        }
    }

    sit.DESCRIPTION = device.system;
    sit.CREATED_BY = "https://digitalarsenal.io"
    sit.SOURCE = device.url;
    for (let x in sit) {
        if (sit[x] === null || sit[x]?.length === 0) {
            delete sit[x];
        }
    }
    return sit;
}

function createIDM(device, sitId) {
    const idm = new IDM();
    idm.LATITUDE = device.lat;
    idm.LONGITUDE = device.lon;
    idm.ALTITUDE = device.alt;
    idm.DATA_MODE = DataMode.REAL;
    idm.ID = xxhash.h32(device.objName, 0xABCD).toString(16);
    idm.SIT_ID = sitId;
    idm.DEVICE_TYPE = deviceTypeMap[device.type] || DeviceType.UNKNOWN;
    for (let x in idm) {
        if (idm[x] === null) {
            delete idm[x];
        }
    }
    return idm;
}

function determineSiteType(deviceType) {
    switch (deviceType) {
        case "PHASED_ARRAY_RADAR":
            return SiteType.OBSERVATION_STATION;
        case "OPTICAL":
            return SiteType.ASTRONOMICAL_OBSERVATORY;
        default:
            return SiteType.OTHER;
    }
}

function createHobbyistSIT(hobbyist) {
    const sit = new SITT();
    console.log(hobbyist)
    sit.ID = xxhash.h32(hobbyist.Name || hobbyist.SensorID, 0xABCD).toString(16);
    sit.NAME = hobbyist.Name;
    sit.SITE_TYPE = SiteType.HOBBYIST_OBSERVER;
    sit.LATITUDE = parseFloat(hobbyist.Lat);
    sit.LONGITUDE = parseFloat(hobbyist.Lon);
    sit.ALTITUDE = parseFloat(hobbyist['Alt (m)']) || 0;
    for (let x in sit) {
        if (sit[x] === null || sit[x]?.length === 0) {
            delete sit[x];
        }
    }
    return sit;
}

function createHobbyistIDM(hobbyist, sitId) {
    const deviceType = DeviceType.OPTICAL;
    const idm = new IDM();
    idm.LATITUDE = parseFloat(hobbyist.Lat);
    idm.LONGITUDE = parseFloat(hobbyist.Lon);
    idm.ALTITUDE = parseFloat(hobbyist['Alt (m)']) || 0;
    idm.CREATED_AT = new Date().toISOString();
    idm.CREATED_BY = "Hobbyist";
    idm.DATA_MODE = DataMode.REAL;
    idm.ID = xxhash.h32(hobbyist.Name + hobbyist.DeviceID, 0xABCD).toString(16);
    idm.SIT_ID = sitId;
    idm.DEVICE_TYPE = deviceType;
    for (let x in idm) {
        if (idm[x] === null || idm[x]?.length === 0) {
            delete idm[x];
        }
    }
    return idm;
}

const sitCollection = new SITCOLLECTIONT();
const idmCollection = new IDMCOLLECTIONT();

for (const key in devices) {
    const device = devices[key];
    const sit = createSIT(device);

    // Check if SIT ID already exists before pushing
    if (!idExistsInCollection(sit.ID, sitCollection)) {
        sitCollection.RECORDS.push(sit);
    }

    const idm = createIDM(device, sit.ID);

    // Check if IDM ID already exists before pushing
    if (!idExistsInCollection(idm.ID, idmCollection)) {
        idmCollection.RECORDS.push(idm);
    }
}

HOBBYISTS.forEach(hobbyist => {
    const sit = createHobbyistSIT(hobbyist);

    if (!idExistsInCollection(sit.ID, sitCollection)) {
        sitCollection.RECORDS.push(sit);
    }

    const idm = createHobbyistIDM(hobbyist, sit.ID);
    if (!idExistsInCollection(idm.ID, sitCollection)) {
        idmCollection.RECORDS.push(idm);
    }
});

// Function to create SIT messages from the prc_sosi.json data
function createSITFromPRC(data) {
    const sit = new SITT();
    sit.ID = xxhash.h32(data["Site Name"], 0xABCD).toString(16);
    sit.NAME = data["Site Name"];
    sit.SITE_TYPE = SiteType.OTHER; // Set the appropriate site type here
    sit.LATITUDE = data["Lat (degrees)"];
    sit.LONGITUDE = data["Long (degrees)"];
    sit.ALTITUDE = data["Elevation (meters)"] || 0; // You may need to adjust this field

    // Add additional fields specific to your requirements

    return sit;
}

// Create a collection for the new SIT messages
const prcSosiSITCollection = new SITCOLLECTIONT();

// Loop through the prc_sosi.json data and create SIT messages
for (const data of PRCSOSI) {
    const sit = createSITFromPRC(data);

    // Check if SIT ID already exists before pushing
    if (!idExistsInCollection(sit.ID, sitCollection)) {
        prcSosiSITCollection.RECORDS.push(sit);
    }
}

// Merge the new SIT messages with the existing SIT collection
sitCollection.RECORDS = sitCollection.RECORDS.concat(prcSosiSITCollection.RECORDS);

const sitOutputFilename = 'data/sosi_sit_collection.json';
writeFileSync(sitOutputFilename, JSON.stringify({ SITCOLLECTION: sitCollection }, null, 2));
console.log(`SITCOLLECTION written to ${sitOutputFilename}`);

const idmOutputFilename = 'data/sosi_idm_collection.json';
writeFileSync(idmOutputFilename, JSON.stringify({ IDMCOLLECTION: idmCollection }, null, 2));
console.log(`IDMCOLLECTION written to ${idmOutputFilename}`);
