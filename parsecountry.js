import csvParser from 'csv-parser';
import fs, { writeFileSync } from 'fs';
import axios from 'axios';
import cheerio from 'cheerio';
import { SITT, SiteType, SITCOLLECTIONT } from "./lib/SIT/main.js";
import xxhash from "xxhashjs";

const countries = [];

fs.createReadStream("./raw/countrycodes.csv")
    .pipe(csvParser())
    .on('data', (data) => countries.push(parseCountryData(data)))
    .on('end', () => {
        writeFileSync("./data/ctr_collection.json", JSON.stringify({ CTRCOLLECTION: { RECORDS: countries } }, null, 2));

        // Further processing with countries data
    });

function parseCountryData(country) {
    // Split the ISO 3166 codes into parts
    let isoCodes = country['ISO 3166'].split('|');

    // Create an object for each country with the required schema
    return {
        ID: isoCodes[2], // Numeric code
        NAME: Object.entries(country)[0][1],
        GENC_CODE: country.GENC,
        STANAG_CODE: country.Stanag,
        INTERNET_CCTLD: country.Internet,
        Comment: country.Comment,
        ALPHA_2_CODE: isoCodes[0],  // Alpha-2 code
        ALPHA_3_CODE: isoCodes[1],  // Alpha-3 code

    };


}
