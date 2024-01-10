import { readFileSync } from "fs";
import fetch from 'node-fetch';

const response = await fetch('http://nssdc.planet4589.com/space/gcat/tsv/launch/launch.tsv');
const launch = await response.text();
const lines = launch.trim().split('\n');
const headers = lines[0].slice(1,).split('\t');
const last_updated = new Date(lines[1].split("Updated")[1]);
const parsedData = lines.slice(2).map(line => {
    const values = line.split('\t');
    const obj = {};
    headers.forEach((header, index) => {
        obj[header] = values[index];
    });
    return obj;
});

console.log(last_updated);