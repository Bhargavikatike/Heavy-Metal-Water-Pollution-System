/**
 * Scientific Contamination Detection Logic
 * Compares calculated indices against stored database thresholds and categories.
 */

/**
 * Find matching threshold category label for a calculated index value from database range categories
 */
const getCategoryFromThresholds = (value, categories = [], defaultLabel = "Acceptable") => {
  if (!categories || categories.length === 0) return defaultLabel;

  for (const cat of categories) {
    const min = cat.min !== undefined && cat.min !== null ? cat.min : -Infinity;
    const max = cat.max !== undefined && cat.max !== null ? cat.max : Infinity;

    if (value >= min && value < max) {
      return cat.label;
    }
  }

  const lastCat = categories[categories.length - 1];
  if (lastCat && value >= lastCat.min) {
    return lastCat.label;
  }

  return defaultLabel;
};

/**
 * Determine Overall Water Quality Status according to system rules:
 * - SAFE WATER: If all values remain within acceptable limits.
 * - CONTAMINATED WATER: If one or more indices exceed permissible thresholds.
 * - HIGHLY CONTAMINATED WATER: If multiple indices exceed thresholds significantly.
 * - SEVERELY CONTAMINATED WATER: If most indices fall in critical category.
 */
const determineOverallWaterStatus = ({
  hpi,
  mi,
  pli,
  hpiCategory,
  miCategory,
  pliCategory,
  exceededMetalsCount = 0,
}) => {
  // Check critical condition triggers: HPI > 200, MI > 4, PLI > 2 with multiple exceeded metals, or Critical Pollution label
  const isHpiCritical = hpi > 200 || hpiCategory === "Critical Pollution";
  const isMiCritical = mi > 4 || miCategory === "Seriously Polluted" || miCategory === "Strongly Polluted";
  const isPliCritical = pli > 2 || pliCategory === "Heavy Pollution";

  let criticalCount = 0;
  if (isHpiCritical) criticalCount++;
  if (isMiCritical) criticalCount++;
  if (isPliCritical) criticalCount++;
  if (exceededMetalsCount >= 3) criticalCount++;

  // 1. SEVERELY CONTAMINATED WATER
  if (criticalCount >= 2 || hpi > 200 || mi > 6) {
    return "SEVERELY CONTAMINATED WATER";
  }

  // 2. HIGHLY CONTAMINATED WATER
  if (
    hpi > 100 ||
    mi > 2 ||
    pli > 1.5 ||
    hpiCategory === "High Pollution" ||
    miCategory === "Moderately Polluted" ||
    exceededMetalsCount >= 2
  ) {
    return "HIGHLY CONTAMINATED WATER";
  }

  // 3. CONTAMINATED WATER
  if (
    hpi > 50 ||
    mi > 1 ||
    pli > 1.0 ||
    hpiCategory === "Moderate Pollution" ||
    miCategory === "Slightly Polluted" ||
    exceededMetalsCount >= 1
  ) {
    return "CONTAMINATED WATER";
  }

  // 4. SAFE WATER
  return "SAFE WATER";
};

module.exports = {
  getCategoryFromThresholds,
  determineOverallWaterStatus,
};