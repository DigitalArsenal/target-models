//@ts-check
import { existsSync } from "fs";
import { writeFileSync } from "fs";
import { SITT, SITCOLLECTIONT, SiteType } from "./lib/SIT/main.js";
import satnogs from "./data/satnogs/satnogs.sit.json" assert {type: "json"};
import launchsites from "./data/thespacedevs/launch.sit.json" assert {type: "json"};
import sosi from "./data/sosi_sit_collection.json" assert {type: "json"};

console.log(sosi.SITCOLLECTION.RECORDS.length);
//@ts-ignore  what the fuck
console.log(launchsites.SITCOLLECTION.RECORDS.length);
console.log(satnogs.SITCOLLECTION.RECORDS.length);

let combined = {
  SITCOLLECTION: {
    RECORDS: [
      ...sosi.SITCOLLECTION.RECORDS,
      //@ts-ignore
      ...launchsites.SITCOLLECTION.RECORDS,
      ...satnogs.SITCOLLECTION.RECORDS
    ]
  }
};

writeFileSync("./dist/SITCOLLECTION.json", JSON.stringify(combined));