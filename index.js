//@ts-check
import cluster from "cluster";
import { existsSync } from "fs";
import { writeFileSync } from "fs";
import XLSX from "xlsx";
import { SITT, SiteType } from "./lib/SIT/main.js";


/**
 * Calculates the sum of two numbers.
 * 
 * @param {number} a - The first number to be added.
 * @param {number} b - The second number to be added.
 * @returns {number} The sum of `a` and `b`.
 */
function test(a, b) {
  return a + b;
}

test(1, 2);

console.log(SITT);