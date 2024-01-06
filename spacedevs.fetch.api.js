import fetch from "node-fetch";

/**
 * Fetches data from a given URL of The Space Devs API.
 * This function retrieves data page by page, concatenating the results from each page.
 * It handles pagination by following the 'next' URL provided in the API response.
 * 
 * @async
 * @param {string} initialUrl - The initial URL to start fetching data from.
 * @returns {Promise<Object[]>} A promise that resolves to an array of objects from the API.
 */
async function fetchFromSpaceDevsApi(initialUrl) {
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
    }

    return allData;
}

// Example usage for fetching locations
const locationsUrl = "https://ll.thespacedevs.com/2.2.0/location/?format=json";
fetchFromSpaceDevsApi(locationsUrl).then(allLocations => {
    console.log('Total Locations:', allLocations.length);
    // Process or write the locations data
}).catch(error => {
    console.error('An error occurred:', error);
});

// Example usage for fetching launch pads
const padsUrl = "https://ll.thespacedevs.com/2.2.0/pad/?format=json";
fetchFromSpaceDevsApi(padsUrl).then(allPads => {
    console.log('Total Pads:', allPads.length);
    // Process or write the pads data
}).catch(error => {
    console.error('An error occurred:', error);
});