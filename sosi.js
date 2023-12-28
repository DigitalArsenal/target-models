import { writeFileSync } from 'fs';
import { SITT, SiteType, SITCOLLECTIONT } from "./lib/SIT/main.js";
import { SENT, SensorType, SENCOLLECTIONT, DataMode } from "./lib/SEN/main.js";
import xxhash from "xxhashjs";
import { sensors } from "./raw/sensors.js";
import CTRC from "./data/ctr_collection.json" assert {type: "json"};
import HOBBYISTS from "./raw/json/hobby_sosi.json" assert {type: "json"};

const sensorTypeMap = {
    "PHASED_ARRAY_RADAR": SensorType.PHASED_ARRAY_RADAR,
    "SYNTHETIC_APERTURE_RADAR": SensorType.SYNTHETIC_APERTURE_RADAR,
    "BISTATIC_RADIO_TELESCOPE": SensorType.BISTATIC_RADIO_TELESCOPE,
    "RADIO_TELESCOPE": SensorType.RADIO_TELESCOPE,
    "ATMOSPHERIC_SENSOR": SensorType.ATMOSPHERIC_SENSOR,
    "SPACE_WEATHER_SENSOR": SensorType.SPACE_WEATHER_SENSOR,
    "ENVIRONMENTAL_SENSOR": SensorType.ENVIRONMENTAL_SENSOR,
    "SEISMIC_SENSOR": SensorType.SEISMIC_SENSOR,
    "GRAVIMETRIC_SENSOR": SensorType.GRAVIMETRIC_SENSOR,
    "MAGNETIC_SENSOR": SensorType.MAGNETIC_SENSOR,
    "ELECTROMAGNETIC_SENSOR": SensorType.ELECTROMAGNETIC_SENSOR,
    "THERMAL_SENSOR": SensorType.THERMAL_SENSOR,
    "CHEMICAL_SENSOR": SensorType.CHEMICAL_SENSOR,
    "BIOLOGICAL_SENSOR": SensorType.BIOLOGICAL_SENSOR,
    "RADIATION_SENSOR": SensorType.RADIATION_SENSOR,
    "PARTICLE_DETECTOR": SensorType.PARTICLE_DETECTOR,
    "LIDAR": SensorType.LIDAR,
    "SONAR": SensorType.SONAR,
    "TELESCOPE": SensorType.TELESCOPE,
    "SPECTROSCOPIC_SENSOR": SensorType.SPECTROSCOPIC_SENSOR,
    "PHOTOMETRIC_SENSOR": SensorType.PHOTOMETRIC_SENSOR,
    "POLARIMETRIC_SENSOR": SensorType.POLARIMETRIC_SENSOR,
    "INTERFEROMETRIC_SENSOR": SensorType.INTERFEROMETRIC_SENSOR,
    "MULTISPECTRAL_SENSOR": SensorType.MULTISPECTRAL_SENSOR,
    "HYPERSPECTRAL_SENSOR": SensorType.HYPERSPECTRAL_SENSOR,
    "GPS_RECEIVER": SensorType.GPS_RECEIVER,
    "SATELLITE_TRACKING_SENSOR": SensorType.SATELLITE_TRACKING_SENSOR,
    "UNKNOWN": SensorType.UNKNOWN
};

function createSIT(sensor) {
    const sit = new SITT();
    sit.ID = xxhash.h32(sensor.name, 0xABCD).toString(16);
    sit.NAME = sensor.name;
    sit.ABBREVIATION = sensor.objName;
    sit.SITE_TYPE = determineSiteType(sensor.type);
    sit.LATITUDE = sensor.lat;
    sit.LONGITUDE = sensor.lon;
    sit.ALTITUDE = sensor.alt;

    for (let c = 0; c < CTRC.CTRCOLLECTION.RECORDS.length; c++) {
        if (~JSON.stringify(CTRC.CTRCOLLECTION.RECORDS[c]).toLowerCase().indexOf(sensor.country.toLowerCase())) {
            sit.CTR_ID = CTRC.CTRCOLLECTION.RECORDS[c].ID;
        } else if (CTRC.CTRCOLLECTION.RECORDS[c].ID === "036" && sensor.country === "Australia") {
            console.log(JSON.stringify(CTRC.CTRCOLLECTION.RECORDS[c]).toLowerCase(), sensor.country.toLowerCase());
        }
    }
    if (!sit.CTR_ID) {
        if (sensor.country === "Australia") {
            sit.CTR_ID = "036";
        } else {
            console.error(`${sensor.country} not found`)
        }
    }

    sit.DESCRIPTION = sensor.system;
    sit.CREATED_BY = "https://digitalarsenal.io"
    sit.SOURCE = sensor.url;
    for (let x in sit) {
        if (sit[x] === null || sit[x]?.length === 0) {
            delete sit[x];
        }
    }
    return sit;
}

function createSEN(sensor, sitId) {
    const sen = new SENT();
    sen.LATITUDE = sensor.lat;
    sen.LONGITUDE = sensor.lon;
    sen.ALTITUDE = sensor.alt;
    sen.DATA_MODE = DataMode.REAL;
    sen.ID_SENSOR = xxhash.h32(sensor.objName, 0xABCD).toString(16);
    sen.SIT_ID = sitId;
    sen.SENSOR_TYPE = sensorTypeMap[sensor.type] || SensorType.UNKNOWN;
    for (let x in sen) {
        if (sen[x] === null) {
            delete sen[x];
        }
    }
    return sen;
}

function determineSiteType(sensorType) {
    switch (sensorType) {
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

function createHobbyistSEN(hobbyist, sitId) {
    const sensorType = SensorType.OPTICAL;
    const sen = new SENT();
    sen.LATITUDE = parseFloat(hobbyist.Lat);
    sen.LONGITUDE = parseFloat(hobbyist.Lon);
    sen.ALTITUDE = parseFloat(hobbyist['Alt (m)']) || 0;
    sen.CREATED_AT = new Date().toISOString();
    sen.CREATED_BY = "Hobbyist";
    sen.DATA_MODE = DataMode.REAL;
    sen.ID_SENSOR = xxhash.h32(hobbyist.Name + hobbyist.SensorID, 0xABCD).toString(16);
    sen.SIT_ID = sitId;
    sen.SENSOR_TYPE = sensorType;
    for (let x in sen) {
        if (sen[x] === null || sen[x]?.length === 0) {
            delete sen[x];
        }
    }
    return sen;
}

const sitCollection = new SITCOLLECTIONT();
const senCollection = new SENCOLLECTIONT();

for (const key in sensors) {
    const sensor = sensors[key];
    const sit = createSIT(sensor);
    sitCollection.RECORDS.push(sit);

    const sen = createSEN(sensor, sit.ID);
    senCollection.RECORDS.push(sen);
}

HOBBYISTS.forEach(hobbyist => {
    const sit = createHobbyistSIT(hobbyist);
    sitCollection.RECORDS.push(sit);

    const sen = createHobbyistSEN(hobbyist, sit.ID);
    senCollection.RECORDS.push(sen);
});

const sitOutputFilename = 'data/sensors_sit_collection.json';
writeFileSync(sitOutputFilename, JSON.stringify({ SITCOLLECTION: sitCollection }, null, 2));
console.log(`SITCOLLECTION written to ${sitOutputFilename}`);

const senOutputFilename = 'data/sensors_sen_collection.json';
writeFileSync(senOutputFilename, JSON.stringify({ SENCOLLECTION: senCollection }, null, 2));
console.log(`SENCOLLECTION written to ${senOutputFilename}`);
