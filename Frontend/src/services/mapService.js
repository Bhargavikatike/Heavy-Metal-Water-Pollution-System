import axios from "axios";
import { factories as fallbackFactories, waterBodies as fallbackWaterBodies } from "../data/sampleLocations";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Flag indicating whether demo sample data is being used.
// Set to false as real REST APIs are connected.
export const IS_DEMO_MODE = false;

/**
 * Fetch factory locations and details from backend REST API
 */
export const getFactories = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/map/factories`);
    if (response.data && response.data.factories) {
      return response.data.factories;
    }
    return fallbackFactories;
  } catch (error) {
    console.warn("Backend API unavailable when fetching factories, using baseline data:", error.message);
    return fallbackFactories;
  }
};

/**
 * Fetch water body locations and details dynamically from backend REST API
 */
export const getWaterBodies = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/map/water-bodies`);
    if (response.data && response.data.waterBodies) {
      return response.data.waterBodies;
    }
    return fallbackWaterBodies;
  } catch (error) {
    console.warn("Backend API unavailable when fetching water bodies, using baseline data:", error.message);
    return fallbackWaterBodies;
  }
};
