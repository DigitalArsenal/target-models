import generateLaunchSites from "./launchSites.js";
import generateSatnogs from "./satnogs.js";
import generateSosi from "./sosi.js";
import generateSlc from "./slc.js";

export const dataSources = [
  { name: "launchsites", generate: generateLaunchSites },
  { name: "satnogs", generate: generateSatnogs },
  { name: "sosi", generate: generateSosi },
  { name: "slc", generate: generateSlc },
];
