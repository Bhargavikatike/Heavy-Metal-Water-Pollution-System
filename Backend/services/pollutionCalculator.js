/**
 * Scientific Calculation Service using MongoDB Metal Standards & IEEE Formulas
 */

/**
 * Calculate HPI (Heavy Metal Pollution Index)
 * HPI = Σ(Wi × Qi) / ΣWi
 * Qi = (|Ci - Ii| / (Si - Ii)) × 100
 */
const calculateHPI = (sample, standards) => {
  let numerator = 0;
  let denominator = 0;

  standards.forEach((std) => {
    const symbolKey = (std.symbol || "").toLowerCase();
    const measured = Number(sample[symbolKey]) || 0;
    const permissibleLimit = Number(std.permissibleLimit) || 0.01;
    const idealValue = Number(std.idealValue) || 0;
    const unitWeight = Number(std.unitWeight) || (1 / permissibleLimit);

    const diff = permissibleLimit - idealValue;
    const qualityRating = diff !== 0
      ? (Math.abs(measured - idealValue) / diff) * 100
      : 0;

    numerator += qualityRating * unitWeight;
    denominator += unitWeight;
  });

  if (denominator === 0) return 0;
  return Number((numerator / denominator).toFixed(2));
};

/**
 * Calculate MI (Metal Index)
 * MI = Σ(Ci / MACi)
 */
const calculateMI = (sample, standards) => {
  let mi = 0;

  standards.forEach((std) => {
    const symbolKey = (std.symbol || "").toLowerCase();
    const measured = Number(sample[symbolKey]) || 0;
    const mac = Number(std.permissibleLimit) || 0.01;

    if (mac > 0) {
      mi += measured / mac;
    }
  });

  return Number(mi.toFixed(2));
};

/**
 * Calculate CF (Contamination Factor)
 * CF = Csample / Cbackground
 */
const calculateCF = (sample, standards) => {
  const cfMap = {};

  standards.forEach((std) => {
    const symbolKey = (std.symbol || "").toLowerCase();
    const measured = Number(sample[symbolKey]) || 0;
    const background = Number(std.backgroundConcentration) || (std.permissibleLimit * 0.2) || 0.001;

    const cf = background > 0 ? measured / background : 0;
    cfMap[symbolKey] = Number(cf.toFixed(2));
  });

  return cfMap;
};

/**
 * Calculate PLI (Pollution Load Index)
 * PLI = (CF1 × CF2 × ... × CFn)^(1/n)
 */
const calculatePLI = (cfMap) => {
  const values = Object.values(cfMap).map((v) => Math.max(0.0001, v));
  if (values.length === 0) return 0;

  let logSum = 0;
  values.forEach((v) => {
    logSum += Math.log(v);
  });

  const meanLog = logSum / values.length;
  const pli = Math.exp(meanLog);

  return Number(pli.toFixed(2));
};

/**
 * Calculate Igeo (Geo-Accumulation Index)
 * Igeo = log2( Ci / (1.5 × Bi) )
 */
const calculateIgeo = (sample, standards) => {
  const igeoMap = {};

  standards.forEach((std) => {
    const symbolKey = (std.symbol || "").toLowerCase();
    const measured = Number(sample[symbolKey]) || 0;
    const background = Number(std.backgroundConcentration) || 0.001;

    const factor = 1.5 * background;
    if (measured <= 0 || factor <= 0) {
      igeoMap[symbolKey] = 0;
    } else {
      const value = Math.log2(measured / factor);
      igeoMap[symbolKey] = Number(Math.max(-5, value).toFixed(2));
    }
  });

  return igeoMap;
};

/**
 * Get list of metals exceeding permissible limits
 */
const getExceededMetals = (sample, standards) => {
  const exceeded = [];

  standards.forEach((std) => {
    const symbolKey = (std.symbol || "").toLowerCase();
    const measured = Number(sample[symbolKey]) || 0;
    const limit = Number(std.permissibleLimit) || 0.01;

    if (measured > limit) {
      exceeded.push({
        metal: std.metal,
        symbol: std.symbol,
        measuredValue: measured,
        permissibleLimit: limit,
        unit: "mg/L",
      });
    }
  });

  return exceeded;
};

module.exports = {
  calculateHPI,
  calculateMI,
  calculateCF,
  calculatePLI,
  calculateIgeo,
  getExceededMetals,
};