import fetch from "node-fetch";
import { writeFileSync } from "fs";

/**
 * Fetches data from a given URL of The Space Devs API with a delay between requests.
 * This function retrieves data page by page, concatenating the results from each page,
 * and includes an optional sleep duration between requests.
 * 
 * @async
 * @param {string} initialUrl - The initial URL to start fetching data from.
 * @param {number} sleepDuration - The duration (in milliseconds) to sleep between requests.
 * @returns {Promise<Object[]>} A promise that resolves to an array of objects from the API.
 */
async function fetchFromSpaceDevsApi(initialUrl, sleepDuration = 0) {
    let nextUrl = initialUrl;
    const allData = [];

    while (nextUrl) {
        console.log(`Retrieving: ${nextUrl}`);
        const response = await fetch(nextUrl);

        if (!response.ok) {
            throw new Error(`Error fetching data: ${response.statusText}`);
        }

        const data = await response.json();
        allData.push(...data.results);

        nextUrl = data.next; // Update the nextUrl for the next iteration

        if (sleepDuration > 0) {
            await new Promise(resolve => setTimeout(resolve, sleepDuration)); // Sleep for the specified duration
        }
    }

    return allData;
}
/*
// Example usage for fetching locations
const locationsUrl = "https://ll.thespacedevs.com/2.2.0/location/?format=json&limit=100";
fetchFromSpaceDevsApi(locationsUrl).then(allLocations => {
    console.log('Total Locations:', allLocations.length);
    writeFileSync('./data/thespacedevs/locations.json', JSON.stringify(allLocations, null, 2));
    // Process or write the locations data
}).catch(error => {
    console.error('An error occurred:', error);
});

// Example usage for fetching launch pads
const padsUrl = "https://ll.thespacedevs.com/2.2.0/pad/?format=json&limit=100";
fetchFromSpaceDevsApi(padsUrl).then(allPads => {
    console.log('Total Pads:', allPads.length);
    writeFileSync('./data/thespacedevs/pads.json', JSON.stringify(allPads, null, 2));
    // Process or write the pads data
}).catch(error => {
    console.error('An error occurred:', error);
});
*/

const launchURL = "https://ll.thespacedevs.com/2.2.0/launch/?limit=100";

fetchFromSpaceDevsApi(launchURL, 4 * 60 * 1000).then(allPads => {
    console.log('Total Launches:', allPads.length);
    writeFileSync('./data/thespacedevs/launches.json', JSON.stringify(allPads, null, 2));
    // Process or write the pads data
}).catch(error => {
    console.error('An error occurred:', error);
});
