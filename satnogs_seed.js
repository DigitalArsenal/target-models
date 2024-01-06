import fetch from "node-fetch";
import { writeFileSync } from "fs";

/**
 * Fetches all station data from the SatNOGS Network API.
 * This function retrieves data page by page, concatenates the results from each page,
 * and stores the combined list of all stations. If an invalid page or other error is encountered,
 * the function logs the error and stops fetching further data.
 * 
 * @async
 * @returns {Promise<Object[]>} A promise that resolves to an array of station objects.
 */
async function fetchAllStations() {
    let page = 1;
    let hasMorePages = true;
    const allStations = [];

    while (hasMorePages) {
        console.log(`retrieving page ${page}`);
        const response = await fetch(`https://network.satnogs.org/api/stations/?format=json&page=${page}`);

        if (!response.ok) {
            const errorDetail = await response.json();
            if (errorDetail.detail === 'Invalid page.') {
                hasMorePages = false;
            } else {
                console.error('Error fetching data:', errorDetail);
            }
            break;
        }

        const data = await response.json();
        allStations.push(...data);
        page++;
    }

    return allStations;
}

fetchAllStations().then(allStations => {
    console.log('Total Stations:', allStations.length);
    writeFileSync("./data/satnogs/stations.json", JSON.stringify(allStations, null, 4));
}).catch(error => {
    console.error('An error occurred:', error);
});