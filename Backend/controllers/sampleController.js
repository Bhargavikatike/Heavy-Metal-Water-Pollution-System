const WaterSample = require("../models/WaterSample");
const XLSX = require("xlsx");
const { createNotification } = require("../services/notificationHelper");

// Helper to calculate HPI & Risk Level based on WHO standards
const calculateHPIRisk = (sampleData) => {
  const metals = {
    pb: { conc: Number(sampleData.pb) || 0, limit: 0.01, weight: 0.7 },
    cd: { conc: Number(sampleData.cd) || 0, limit: 0.003, weight: 0.7 },
    cr: { conc: Number(sampleData.cr) || 0, limit: 0.05, weight: 0.7 },
    as: { conc: Number(sampleData.as) || 0, limit: 0.01, weight: 0.7 },
    hg: { conc: Number(sampleData.hg) || 0, limit: 0.006, weight: 0.7 },
    ni: { conc: Number(sampleData.ni) || 0, limit: 0.07, weight: 0.3 },
    cu: { conc: Number(sampleData.cu) || 0, limit: 2.0, weight: 0.1 },
    zn: { conc: Number(sampleData.zn) || 0, limit: 3.0, weight: 0.01 },
    fe: { conc: Number(sampleData.fe) || 0, limit: 0.3, weight: 0.003 },
  };

  let sumNumerator = 0;
  let sumWeight = 0;

  Object.values(metals).forEach(({ conc, limit, weight }) => {
    const subIndex = (conc / limit) * 100;
    sumNumerator += subIndex * weight;
    sumWeight += weight;
  });

  const hpi = Number((sumNumerator / (sumWeight || 1)).toFixed(2));
  let riskLevel = "Low";
  if (hpi >= 100) riskLevel = "High";
  else if (hpi >= 60) riskLevel = "Medium";

  return { hpi, riskLevel };
};

/**
 * 1. Manual Entry - Add Single Water Sample
 */
const addSample = async (req, res) => {
  try {
    const body = req.body;
    if (!body.locationName && !body.name) {
      return res.status(400).json({
        success: false,
        message: "Sample Name / Location is required",
      });
    }

    const locationName = (body.locationName || body.name || "").trim();
    const district = (body.district || body.location || "Telangana").trim();
    const waterSource = body.waterSource || "Urban Lake";
    const collectionDate = body.date || body.collectionDate || new Date();
    const collector = body.collector || req.user?.name || "Researcher";

    const { hpi, riskLevel } = calculateHPIRisk(body);
    const finalRiskLevel = body.riskLevel || riskLevel;

    // Generate unique sampleId
    const count = await WaterSample.countDocuments();
    const year = new Date().getFullYear();
    const generatedSampleId = body.sampleId || `SMP-${year}-${String(count + 1).padStart(3, "0")}`;

    const sample = await WaterSample.create({
      sampleId: generatedSampleId,
      locationName,
      district,
      waterSource,
      latitude: Number(body.latitude) || 17.385,
      longitude: Number(body.longitude) || 78.4866,
      collectionDate,
      pb: Number(body.pb) || (body.metals && Number(body.metals.Pb)) || 0,
      cd: Number(body.cd) || (body.metals && Number(body.metals.Cd)) || 0,
      cr: Number(body.cr) || (body.metals && Number(body.metals.Cr)) || 0,
      as: Number(body.as) || (body.metals && Number(body.metals.As)) || 0,
      hg: Number(body.hg) || (body.metals && Number(body.metals.Hg)) || 0,
      ni: Number(body.ni) || (body.metals && Number(body.metals.Ni)) || 0,
      cu: Number(body.cu) || (body.metals && Number(body.metals.Cu)) || 0,
      zn: Number(body.zn) || (body.metals && Number(body.metals.Zn)) || 0,
      fe: Number(body.fe) || (body.metals && Number(body.metals.Fe)) || 0,
      hpi: Number(body.hpi) || hpi,
      riskLevel: finalRiskLevel,
      status: body.status || "Analyzed",
      collector,
      researcher: req.user?._id,
    });

    // Create Notification in MongoDB
    await createNotification({
      title: "Water Sample Added",
      message: `New water sample ${sample.sampleId} logged at ${sample.locationName}`,
      type: "success",
    });

    res.status(201).json({
      success: true,
      message: "Water sample stored successfully in MongoDB",
      sample,
    });
  } catch (error) {
    console.error("Error adding water sample:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to add water sample",
    });
  }
};

/**
 * 2. File Upload - Bulk Import CSV/Excel Records into MongoDB
 */
const uploadSamples = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a CSV or Excel file to upload",
      });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

    if (!rawRows || rawRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "The uploaded file is empty",
      });
    }

    const validSamplesToInsert = [];
    const invalidRows = [];

    const existingCount = await WaterSample.countDocuments();
    const year = new Date().getFullYear();

    for (let index = 0; index < rawRows.length; index++) {
      const row = rawRows[index];
      const rowNum = index + 2; // 1-indexed row header offset

      let locationName = "";
      let district = "Telangana";
      let waterSource = "Urban Lake";
      let latitude = 17.385;
      let longitude = 78.4866;
      let date = new Date();
      let collector = req.user?.name || "Researcher";
      let sampleId = "";
      let customRiskLevel = "";

      let pb = 0, cd = 0, cr = 0, as = 0, hg = 0, ni = 0, cu = 0, zn = 0, fe = 0;

      Object.entries(row).forEach(([key, val]) => {
        if (val === undefined || val === null || String(val).trim() === "") return;
        const valStr = String(val).trim();
        const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

        // Location / Sample Name
        if (
          !locationName &&
          (cleanKey.includes("location") ||
            cleanKey.includes("samplename") ||
            cleanKey.includes("waterbody") ||
            cleanKey.includes("site") ||
            cleanKey === "name" ||
            cleanKey === "sample")
        ) {
          locationName = valStr;
        }

        // District / Region / City
        if (
          cleanKey.includes("district") ||
          cleanKey.includes("region") ||
          cleanKey.includes("city") ||
          cleanKey.includes("state")
        ) {
          district = valStr;
        }

        // Water Source
        if (
          cleanKey.includes("source") ||
          cleanKey.includes("watertype") ||
          cleanKey.includes("sourcetype")
        ) {
          waterSource = valStr;
        }

        // Sample ID
        if (cleanKey.includes("sampleid") || cleanKey === "id") {
          sampleId = valStr;
        }

        // Collector
        if (
          cleanKey.includes("collector") ||
          cleanKey.includes("researcher") ||
          cleanKey.includes("by")
        ) {
          collector = valStr;
        }

        // Risk Level
        if (cleanKey.includes("risk")) {
          customRiskLevel = valStr;
        }

        // Date
        if (cleanKey.includes("date") || cleanKey.includes("time")) {
          const parsed = new Date(valStr);
          if (!isNaN(parsed.getTime())) date = parsed;
        }

        // Lat / Lng
        if (cleanKey.includes("lat")) {
          const num = Number(valStr);
          if (!isNaN(num) && num !== 0) latitude = num;
        }
        if (cleanKey.includes("lng") || cleanKey.includes("lon") || cleanKey.includes("long")) {
          const num = Number(valStr);
          if (!isNaN(num) && num !== 0) longitude = num;
        }

        // Heavy Metals matching
        const numVal = Number(valStr);
        if (!isNaN(numVal)) {
          if (/^pb($|[^a-z]|lead)/.test(cleanKey) || cleanKey.includes("lead")) pb = numVal;
          else if (/^cd($|[^a-z]|cadmium)/.test(cleanKey) || cleanKey.includes("cadmium")) cd = numVal;
          else if (/^cr($|[^a-z]|chromium)/.test(cleanKey) || cleanKey.includes("chromium")) cr = numVal;
          else if ((/^as($|[^a-z]|arsenic)/.test(cleanKey) || cleanKey.includes("arsenic")) && !cleanKey.includes("assess")) as = numVal;
          else if (/^hg($|[^a-z]|mercury)/.test(cleanKey) || cleanKey.includes("mercury")) hg = numVal;
          else if (/^ni($|[^a-z]|nickel)/.test(cleanKey) || cleanKey.includes("nickel")) ni = numVal;
          else if (/^cu($|[^a-z]|copper)/.test(cleanKey) || cleanKey.includes("copper")) cu = numVal;
          else if (/^zn($|[^a-z]|zinc)/.test(cleanKey) || cleanKey.includes("zinc")) zn = numVal;
          else if (/^fe($|[^a-z]|iron)/.test(cleanKey) || cleanKey.includes("iron")) fe = numVal;
        }
      });

      // Fallback 1: If locationName still empty, pick the first non-numeric cell in row
      if (!locationName) {
        const firstVal = Object.values(row).find(
          (v) => v !== null && v !== undefined && String(v).trim() !== "" && isNaN(Number(v))
        );
        if (firstVal) {
          locationName = String(firstVal).trim();
        }
      }

      if (!locationName) {
        invalidRows.push({
          row: rowNum,
          reason: "Missing Sample Name / Location",
        });
        continue;
      }

      // Geo coordinates lookup for known Telangana / Hyderabad water bodies if lat/lng are default
      if (latitude === 17.385 && longitude === 78.4866) {
        const locLower = locationName.toLowerCase();
        if (locLower.includes("balapur")) { latitude = 17.3197; longitude = 78.5204; }
        else if (locLower.includes("hussain")) { latitude = 17.4239; longitude = 78.4738; }
        else if (locLower.includes("fox")) { latitude = 17.5342; longitude = 78.4552; }
        else if (locLower.includes("durgam")) { latitude = 17.4334; longitude = 78.3842; }
        else if (locLower.includes("osman")) { latitude = 17.3802; longitude = 78.3000; }
        else if (locLower.includes("himayat")) { latitude = 17.3180; longitude = 78.3580; }
        else if (locLower.includes("saroornagar")) { latitude = 17.3590; longitude = 78.5270; }
        else if (locLower.includes("safilguda")) { latitude = 17.4580; longitude = 78.5340; }
        else if (locLower.includes("mir alam")) { latitude = 17.3560; longitude = 78.4480; }
      }

      const sampleCalc = calculateHPIRisk({ pb, cd, cr, as, hg, ni, cu, zn, fe });

      const generatedId =
        sampleId ||
        `SMP-${year}-${String(existingCount + validSamplesToInsert.length + 1).padStart(3, "0")}`;

      validSamplesToInsert.push({
        sampleId: generatedId,
        locationName,
        district,
        waterSource,
        latitude,
        longitude,
        collectionDate: date,
        pb,
        cd,
        cr,
        as,
        hg,
        ni,
        cu,
        zn,
        fe,
        hpi: sampleCalc.hpi,
        riskLevel: customRiskLevel || sampleCalc.riskLevel,
        status: "Analyzed",
        collector,
        researcher: req.user?._id,
      });
    }

    if (validSamplesToInsert.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid water sample records found in the uploaded file",
        invalidRows,
      });
    }

    const insertedSamples = await WaterSample.insertMany(validSamplesToInsert);

    // Create Notification in MongoDB
    await createNotification({
      title: "Water Sample Added",
      message: `Bulk uploaded ${insertedSamples.length} water sample records into MongoDB database`,
      type: "success",
    });

    res.status(201).json({
      success: true,
      message: `Successfully imported ${insertedSamples.length} water sample records into MongoDB.`,
      insertedCount: insertedSamples.length,
      invalidCount: invalidRows.length,
      invalidRows,
      samples: insertedSamples,
    });
  } catch (error) {
    console.error("Error bulk uploading water samples:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process bulk sample file upload",
    });
  }
};

/**
 * 3. Water Samples Page & Dashboard - Fetch Samples from MongoDB with Search, Filter & Pagination
 */
const getAllSamples = async (req, res) => {
  try {
    const { search, riskLevel, waterSource, page = 1, limit = 50 } = req.query;

    const query = {};

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { sampleId: searchRegex },
        { locationName: searchRegex },
        { district: searchRegex },
        { waterSource: searchRegex },
        { collector: searchRegex },
      ];
    }

    if (riskLevel && riskLevel !== "All") {
      query.riskLevel = riskLevel;
    }

    if (waterSource && waterSource !== "All") {
      query.waterSource = waterSource;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const totalSamples = await WaterSample.countDocuments(query);
    const samples = await WaterSample.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: samples.length,
      totalSamples,
      totalPages: Math.ceil(totalSamples / limitNum) || 1,
      currentPage: pageNum,
      samples,
    });
  } catch (error) {
    console.error("Error fetching samples from MongoDB:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching water samples",
    });
  }
};

/**
 * 4. Get Single Water Sample Details by ID
 */
const getSampleById = async (req, res) => {
  try {
    const sample = await WaterSample.findById(req.params.id);
    if (!sample) {
      return res.status(404).json({
        success: false,
        message: "Water sample not found",
      });
    }
    res.status(200).json({
      success: true,
      sample,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching sample details",
    });
  }
};

/**
 * 5. Update Water Sample in MongoDB
 */
const updateSample = async (req, res) => {
  try {
    const body = req.body;

    if (body.pb || body.cd || body.cr || body.as) {
      const { hpi, riskLevel } = calculateHPIRisk(body);
      body.hpi = hpi;
      if (!body.riskLevel) body.riskLevel = riskLevel;
    }

    const sample = await WaterSample.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });

    if (!sample) {
      return res.status(404).json({
        success: false,
        message: "Water sample not found for edit",
      });
    }

    res.status(200).json({
      success: true,
      message: "Water sample updated successfully in MongoDB",
      sample,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update water sample",
    });
  }
};

/**
 * 6. Delete Water Sample from MongoDB
 */
const deleteSample = async (req, res) => {
  try {
    const sample = await WaterSample.findByIdAndDelete(req.params.id);
    if (!sample) {
      return res.status(404).json({
        success: false,
        message: "Water sample not found for deletion",
      });
    }
    res.status(200).json({
      success: true,
      message: `Sample ${sample.sampleId || req.params.id} deleted from MongoDB`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete water sample",
    });
  }
};

module.exports = {
  addSample,
  uploadSamples,
  getAllSamples,
  getSampleById,
  updateSample,
  deleteSample,
};