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

if (locationsData && padsData) {
    // Combine the data and perform the desired operation here
    const combinedData = locationsData.map(location => {
        const matchingPads = padsData.filter(pad => pad.location.id === location.id);
        return {
            ...location,
            pads: matchingPads.map(pad => ({
                id: pad.id,
                name: pad.name,
                latitude: pad.latitude,
                longitude: pad.longitude,
                total_launch_count: pad.total_launch_count,
                orbital_launch_attempt_count: pad.orbital_launch_attempt_count
            }))
        };
    });

    const locationJSON = JSON.stringify(combinedData, null, 2);
    console.log(locationJSON);
    fs.writeFileSync("./data/thespacedevs/locations.combined.json", locationJSON);
}
