import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

/**
 * PollutionHeatmap Component.
 * Renders a Leaflet heatmap layer using pollution intensity data from water bodies.
 *
 * Weight Mapping:
 * - High = 1.0
 * - Medium = 0.6
 * - Low = 0.3
 *
 * Gradient Mapping:
 * - Green (#22c55e) -> Low Risk
 * - Yellow (#eab308) -> Medium Risk
 * - Red (#ef4444) -> High Risk
 */
function PollutionHeatmap({ waterBodies = [] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !waterBodies || waterBodies.length === 0) return;

    // Convert water body pollution levels to heatmap points: [lat, lng, weight]
    const heatPoints = waterBodies
      .filter((water) => water.lat && water.lng)
      .map((water) => {
        let weight = 0.3; // Low pollution weight
        if (water.pollution === "High") {
          weight = 1.0; // High pollution weight
        } else if (water.pollution === "Medium") {
          weight = 0.6; // Medium pollution weight
        }
        return [water.lat, water.lng, weight];
      });

    // Create Leaflet Heat Layer instance with custom parameters and colors
    const heatLayer = L.heatLayer(heatPoints, {
      radius: 80,
      blur: 50,
      maxZoom: 15,
      max: 1.0,
      gradient: {
        0.3: "#22c55e", // Green -> Low
        0.6: "#eab308", // Yellow -> Medium
        1.0: "#ef4444", // Red -> High
      },
    });

    // Overlay heatmap on top of map tiles
    heatLayer.addTo(map);

    // Cleanup: Remove heatmap layer on unmount or toggle off
    return () => {
      if (map) {
        map.removeLayer(heatLayer);
      }
    };
  }, [map, waterBodies]);

  return null;
}

export default PollutionHeatmap;
