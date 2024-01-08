import fetch from "node-fetch";
import { writeFileSync, existsSync, readFileSync } from "fs";
import os from "os";

const browserUserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36";
const apiKey = "49fe812ac4dd919a14ed2ec4f49f376d0c5987ff"; // Replace with your API key

/**
 * Fetches data from a given URL of The Space Devs API with a delay between requests.
 * This function retrieves data page by page, concatenating the results from each page,
 * and includes an optional sleep duration between requests.
 * It also retries the current URL with an exponential backoff strategy if an error occurs.
 * 
 * @async
 * @param {string} baseUrl - The base URL to fetch data from.
 * @param {number} totalItems - The total number of items in the database.
 * @param {number} pageSize - The number of items to retrieve per page.
 * @param {number} sleepDuration - The initial duration (in milliseconds) to sleep between requests.
 * @param {string} tempFilePath - Path to the temporary file for storing partial data.
 * @param {string} stateFilePath - Path to the file for storing the current successful page.
 * @returns {Promise<Object[]>} A promise that resolves to an array of objects from the API.
 */
async function fetchFromSpaceDevsApi(baseUrl, totalItems, pageSize, sleepDuration = 0, tempFilePath, stateFilePath) {
    let currentPage = Math.ceil(totalItems / pageSize);
    let retryCount = 0;
    let successfulPage = 0;

    if (existsSync(stateFilePath)) {
        // Read the successful page from the state file
        successfulPage = parseInt(readFileSync(stateFilePath, 'utf8'));
        currentPage = successfulPage;
    }

    while (currentPage >= 1) {
        const offset = (currentPage - 1) * pageSize;
        const pageUrl = `${baseUrl}&limit=${pageSize}&offset=${offset}`;
        console.log(`Retrieving Page ${currentPage}: ${pageUrl}`);
        const response = await fetch(pageUrl, {
            headers: {
                'User-Agent': browserUserAgent,
                'Authorization': `Token ${apiKey}` // Add your API key here
            }
        });

        if (!response.ok) {
            const retryDelay = Math.pow(2, retryCount) * sleepDuration;
            console.error(`Error fetching data: ${response.statusText}. Retrying in ${retryDelay}ms.`);
            await new Promise(resolve => setTimeout(resolve, retryDelay)); // Exponential backoff
            retryCount++;
        } else {
            retryCount = 0; // Reset retry count on success
            successfulPage = currentPage;
            writeFileSync(stateFilePath, successfulPage.toString()); // Save the successful page
        }

        const data = await response.json();
        const tempData = JSON.parse(readFileSync(tempFilePath, 'utf8'));
        tempData.push(...data.results);
        writeFileSync(tempFilePath, JSON.stringify(tempData, null, 2));
        if (sleepDuration > 0) {
            await new Promise(resolve => setTimeout(resolve, sleepDuration)); // Sleep for the specified duration
        }
        currentPage--;
    }

    const tempData = JSON.parse(readFileSync(tempFilePath, 'utf8'));

    return tempData;
}

const baseUrl = "https://ll.thespacedevs.com/2.2.0/launch/?format=json";
const totalItems = 4600//7132;
const pageSize = 100;
const sleepDuration = /*4 * 60 **/ 1000;
const tempFilePath = './data/thespacedevs/temp.json';
const stateFilePath = './data/thespacedevs/state.txt';
fetchFromSpaceDevsApi(baseUrl, totalItems, pageSize, sleepDuration, tempFilePath, stateFilePath).then(allLaunches => {
    console.log('Total Launches:', allLaunches.length);
    writeFileSync('./data/thespacedevs/launches.json', JSON.stringify(allLaunches, null, 2));
    console.log('Data written to launches.json');

    // Get local IP address
    const networkInterfaces = os.networkInterfaces();
    const localIp = networkInterfaces['Ethernet'][0].address; // Replace 'Ethernet' with your network interface name

    console.log('Local IP Address:', localIp);
}).catch(error => {
    console.error('An error occurred:', error);
});
