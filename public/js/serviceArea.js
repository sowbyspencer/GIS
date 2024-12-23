// js/serviceArea.js
import { SERVICE_AREA_URL } from "./config.js";

export async function calculateServiceArea(params, solveFunction) {
  try {
    const result = await solveFunction(SERVICE_AREA_URL, params);
    return result.serviceAreaPolygons;
  } catch (error) {
    console.error("Error calculating service area:", error);
    throw error;
  }
}
