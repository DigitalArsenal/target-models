import fetch from "node-fetch";
import { writeFileSync } from "fs";
import satnogs_sites from "./data/satnogs.stations.json" assert {type: "json"};

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
            "cookie": "csrftoken=1yOeycsf3r50w7NJ2v4V3MIayCWXRqDMahNXt7CSEd8g6fx5O5ALA6XHkXXkmMF4; sessionid=54qc9n91dapbx7xttoixm356rawvdkty",
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

async function updateStations() {
    const existingStationIds = new Set(satnogs_sites.map(station => station.id));
    const currentStations = await fetchCurrentStations();
    let stationsToUpdate = [];

    for (const station of currentStations) {
        if (!existingStationIds.has(station.id)) {
            console.log(station.id);
            stationsToUpdate.push(station);
        }
    }

    if (stationsToUpdate.length > 0) {
        satnogs_sites.push(...stationsToUpdate);
        writeFileSync("./data/satnogs.stations.json", JSON.stringify(satnogs_sites, null, 4));
    }
}

updateStations().catch(error => {
    console.error('An error occurred:', error);
});
