import L from "leaflet";

/**
 * Custom Factory Marker Icon (🏭 Industrial Point Source)
 */
export const factoryIcon = L.divIcon({
  className: "custom-leaflet-marker factory-marker-icon",
  html: `<div style="
    background: linear-gradient(135deg, #ef4444, #dc2626);
    width: 38px;
    height: 38px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    box-shadow: 0 4px 14px rgba(239, 68, 68, 0.45);
    border: 2.5px solid #ffffff;
    cursor: pointer;
    transition: transform 0.2s ease;
  ">🏭</div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -19],
});

/**
 * Custom Water Body Marker Icon (💧 Hydrological Sample Source)
 */
export const waterIcon = L.divIcon({
  className: "custom-leaflet-marker water-marker-icon",
  html: `<div style="
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    width: 38px;
    height: 38px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    box-shadow: 0 4px 14px rgba(59, 130, 246, 0.45);
    border: 2.5px solid #ffffff;
    cursor: pointer;
    transition: transform 0.2s ease;
  ">💧</div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -19],
});

/**
 * Highlighted Factory Marker Icon (Search selection / Active)
 */
export const highlightedFactoryIcon = L.divIcon({
  className: "custom-leaflet-marker highlighted-factory-marker-icon marker-highlight-pulse",
  html: `<div style="
    background: linear-gradient(135deg, #ef4444, #991b1b);
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.8);
    border: 3px solid #ffffff;
    cursor: pointer;
  ">🏭</div>`,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
  popupAnchor: [0, -24],
});

/**
 * Highlighted Water Marker Icon (Search selection / Active)
 */
export const highlightedWaterIcon = L.divIcon({
  className: "custom-leaflet-marker highlighted-water-marker-icon marker-highlight-pulse",
  html: `<div style="
    background: linear-gradient(135deg, #2563eb, #1e40af);
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    box-shadow: 0 0 20px rgba(37, 99, 235, 0.8);
    border: 3px solid #ffffff;
    cursor: pointer;
  ">💧</div>`,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
  popupAnchor: [0, -24],
});