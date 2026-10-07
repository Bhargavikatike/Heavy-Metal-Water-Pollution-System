import React from "react";
import { Circle, Polygon, Popup, Tooltip } from "react-leaflet";

/**
 * Calculates direction string and unit vector (dx, dy) from water body to nearest factory
 */
function getDirectionVector(water, factories) {
  if (!factories || factories.length === 0) {
    return {
      sourceDir: "East",
      oppositeDir: "West",
      dx: 1,
      dy: 0,
      nearestFactory: { name: "Industrial Zone", lat: water.lat + 0.01, lng: water.lng + 0.01 },
      distanceKm: 1.2,
    };
  }

  let minDistance = Infinity;
  let nearest = factories[0];

  factories.forEach((factory) => {
    const dLat = factory.lat - water.lat;
    const dLng = factory.lng - water.lng;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = factory;
    }
  });

  const dLat = nearest.lat - water.lat;
  const dLng = nearest.lng - water.lng;
  const len = Math.sqrt(dLat * dLat + dLng * dLng) || 1;
  const dx = dLng / len;
  const dy = dLat / len;

  // Approximate distance in km (1 degree ~ 111km)
  const distanceKm = Number((minDistance * 111).toFixed(1));

  let sourceDir = "East";
  let oppositeDir = "West";

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) {
      sourceDir = "East";
      oppositeDir = "West";
    } else {
      sourceDir = "West";
      oppositeDir = "East";
    }
  } else {
    if (dy > 0) {
      sourceDir = "North";
      oppositeDir = "South";
    } else {
      sourceDir = "South";
      oppositeDir = "North";
    }
  }

  if (dx > 0.4 && dy > 0.4) {
    sourceDir = "Northeast";
    oppositeDir = "Southwest";
  } else if (dx < -0.4 && dy > 0.4) {
    sourceDir = "Northwest";
    oppositeDir = "Southeast";
  } else if (dx > 0.4 && dy < -0.4) {
    sourceDir = "Southeast";
    oppositeDir = "Northwest";
  } else if (dx < -0.4 && dy < -0.4) {
    sourceDir = "Southwest";
    oppositeDir = "Northeast";
  }

  return { sourceDir, oppositeDir, dx, dy, nearestFactory: nearest, distanceKm };
}

/**
 * ContaminationOverlays Component
 * Visualizes directional multi-zone contamination (Red = High, Orange = Moderate, Green = Low)
 * derived from HPI, MI, PLI, CF, Igeo values in MongoDB.
 */
function ContaminationOverlays({ waterBodies = [], factories = [] }) {
  if (!waterBodies || !Array.isArray(waterBodies) || waterBodies.length === 0) {
    return null;
  }

  return (
    <>
      {waterBodies.map((water, idx) => {
        if (!water) return null;
        const lat = Number(water.lat);
        const lng = Number(water.lng);
        if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return null;

        const sanitizedWater = { ...water, lat, lng };
        const { sourceDir, oppositeDir, dx, dy, nearestFactory, distanceKm } =
          getDirectionVector(sanitizedWater, factories);

        const hpiNum = Number(sanitizedWater.hpi) || 50;

        // Radii in meters based on HPI pollution severity
        let baseRadius = 800;
        if (hpiNum >= 120 || sanitizedWater.pollution === "High" || sanitizedWater.pollution === "Critical") {
          baseRadius = 1400;
        } else if (hpiNum >= 70 || sanitizedWater.pollution === "Medium") {
          baseRadius = 1000;
        }

        const redRadius = baseRadius * 0.45;
        const orangeRadius = baseRadius * 0.85;
        const greenRadius = baseRadius * 1.35;

        // Offset center coordinates in meters (~111,000 meters per degree)
        const metersPerDegreeLat = 111000;
        const metersPerDegreeLng =
          111000 * Math.max(0.1, Math.cos((lat * Math.PI) / 180));

        const redOffsetLat =
          lat + (dy * (baseRadius * 0.35)) / metersPerDegreeLat;
        const redOffsetLng =
          lng + (dx * (baseRadius * 0.35)) / metersPerDegreeLng;

        const greenOffsetLat =
          lat - (dy * (baseRadius * 0.4)) / metersPerDegreeLat;
        const greenOffsetLng =
          lng - (dx * (baseRadius * 0.4)) / metersPerDegreeLng;

        const zoneKey = `zones-${sanitizedWater.id || sanitizedWater._id || idx}`;

        return (
          <React.Fragment key={zoneKey}>
            {/* 🟢 Low Contamination Zone (Outer / Downstream Outflow) */}
            <Circle
              center={[greenOffsetLat, greenOffsetLng]}
              radius={greenRadius}
              pathOptions={{
                fillColor: "#22c55e",
                fillOpacity: 0.18,
                color: "#166534",
                weight: 1.5,
                dashArray: "6, 6",
              }}
            >
              <Tooltip sticky>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: "12px" }}>
                  <strong>🟢 Low Contamination Zone ({oppositeDir})</strong>
                  <br />
                  Downstream outflow region ({water.name})
                </div>
              </Tooltip>
            </Circle>

            {/* 🟠 Moderate Contamination Zone (Mid-Body Dispersion) */}
            <Circle
              center={[water.lat, water.lng]}
              radius={orangeRadius}
              pathOptions={{
                fillColor: "#f97316",
                fillOpacity: 0.28,
                color: "#c2410c",
                weight: 2,
                dashArray: "4, 4",
              }}
            >
              <Tooltip sticky>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: "12px" }}>
                  <strong>🟠 Moderate Contamination Zone (Center)</strong>
                  <br />
                  Mid-water body dispersion area
                </div>
              </Tooltip>
            </Circle>

            {/* 🔴 High Contamination Zone (Point Source Hotspot) */}
            <Circle
              center={[redOffsetLat, redOffsetLng]}
              radius={redRadius}
              pathOptions={{
                fillColor: "#ef4444",
                fillOpacity: 0.45,
                color: "#991b1b",
                weight: 2.5,
              }}
            >
              <Tooltip sticky>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: "12px" }}>
                  <strong>🔴 High Contamination Zone ({sourceDir})</strong>
                  <br />
                  Proximity hotspot near {nearestFactory.name}
                </div>
              </Tooltip>
              <Popup>
                <div
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    minWidth: "210px",
                    lineHeight: "1.4",
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "15px",
                      fontWeight: "700",
                      color: "#0f172a",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>💧</span> {water.name}
                  </h3>

                  <div
                    style={{
                      backgroundColor: "#f8fafc",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      marginBottom: "10px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "#334155",
                        marginBottom: "4px",
                      }}
                    >
                      Contamination Zones:
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#dc2626",
                        fontWeight: "600",
                      }}
                    >
                      🔴 High ({sourceDir})
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#ea580c",
                        fontWeight: "600",
                      }}
                    >
                      🟠 Moderate (Center)
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#16a34a",
                        fontWeight: "600",
                      }}
                    >
                      🟢 Low ({oppositeDir})
                    </div>
                  </div>

                  <div style={{ fontSize: "12px", color: "#475569", marginBottom: "8px" }}>
                    <strong>Primary Source:</strong>
                    <br />🏭 {nearestFactory.name} ({distanceKm} km {sourceDir})
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "6px",
                      fontSize: "11px",
                      backgroundColor: "#eff6ff",
                      padding: "8px",
                      borderRadius: "6px",
                      border: "1px solid #bfdbfe",
                    }}
                  >
                    <div>
                      <strong>HPI:</strong> {water.hpi}
                    </div>
                    <div>
                      <strong>MI:</strong> {water.mi}
                    </div>
                    <div>
                      <strong>PLI:</strong> {water.pli}
                    </div>
                    <div>
                      <strong>CF:</strong> {water.cf}
                    </div>
                    <div>
                      <strong>Igeo:</strong> {water.igeo}
                    </div>
                  </div>
                </div>
              </Popup>
            </Circle>
          </React.Fragment>
        );
      })}
    </>
  );
}

export default ContaminationOverlays;
