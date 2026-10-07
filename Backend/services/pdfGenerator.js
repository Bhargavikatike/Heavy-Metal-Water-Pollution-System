const PDFDocument = require("pdfkit");

const generatePDF = (assessment, res) => {
  const doc = new PDFDocument({
    margin: 40,
    size: "A4",
  });

  res.setHeader(
    "Content-Type",
    "application/pdf"
  );

  res.setHeader(
    "Content-Disposition",
    "attachment; filename=Pollution_Report.pdf"
  );

  doc.pipe(res);

  const sample = assessment.sampleId;

  const metals = [
    "pb",
    "cd",
    "cr",
    "as",
    "hg",
    "ni",
    "cu",
    "zn",
    "fe",
  ];

  const metalNames = {
    pb: "Lead (Pb)",
    cd: "Cadmium (Cd)",
    cr: "Chromium (Cr)",
    as: "Arsenic (As)",
    hg: "Mercury (Hg)",
    ni: "Nickel (Ni)",
    cu: "Copper (Cu)",
    zn: "Zinc (Zn)",
    fe: "Iron (Fe)",
  };

  const drawSectionTitle = (title) => {
    doc.x = 40;

    doc.moveDown(0.7);

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(title, {
        align: "left"
      });

    const y = doc.y + 3;

    doc
      .moveTo(40, y)
      .lineTo(555, y)
      .stroke();

    doc.moveDown(0.7);

    doc.x = 40;
  };

  const drawTableHeader = (columns) => {
    const startY = doc.y;

    doc.rect(40, startY, 515, 22).stroke();

    let x = 45;

    doc.font("Helvetica-Bold");
    doc.fontSize(10);

    columns.forEach((column) => {
      doc.text(
        column.title,
        x,
        startY + 6,
        {
          width: column.width,
          height: 12
        }
      );

      x += column.width;
    });

    doc.y = startY + 22;
  };

  const drawTableRow = (values, columns) => {
    const startY = doc.y;

    const rowHeight = 24;

    doc.rect(40, startY, 515, rowHeight).stroke();

    let x = 45;

    doc.font("Helvetica");
    doc.fontSize(9);

    values.forEach((value, index) => {
      doc.text(
        String(value ?? "-"),
        x,
        startY + 7,
        {
          width: columns[index].width,
          height: 12
        }
      );

      x += columns[index].width;
    });

    doc.y = startY + rowHeight;
  };

  // =========================
  // HEADER
  // =========================

  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .text(
      "HEAVY METAL WATER POLLUTION",
      {
        align: "center",
      }
    );

  doc
    .fontSize(18)
    .text(
      "ASSESSMENT REPORT",
      {
        align: "center",
      }
    );

  doc.moveDown(0.5);

  doc
    .font("Helvetica")
    .fontSize(9)
    .text(
      "Heavy Metal Water Pollution Assessment System",
      {
        align: "center",
      }
    );

  doc.moveDown(1);

  const headerY = doc.y;

  doc
    .moveTo(40, headerY)
    .lineTo(555, headerY)
    .stroke();

  doc.moveDown();

  // =========================
  // 1. SAMPLE INFORMATION
  // =========================

  drawSectionTitle(
    "1. SAMPLE INFORMATION"
  );

  doc
    .font("Helvetica")
    .fontSize(10);

  doc.text(
    `Sample ID: ${sample?._id || "-"
    }`
  );

  doc.text(
    `Location: ${sample?.locationName || "-"
    }`
  );

  doc.text(
    `District: ${sample?.district || "-"
    }`
  );

  doc.text(
    `Latitude: ${sample?.latitude ?? "-"
    }`
  );

  doc.text(
    `Longitude: ${sample?.longitude ?? "-"
    }`
  );

  doc.text(
    `Collection Date: ${sample?.collectionDate
      ? new Date(
        sample.collectionDate
      ).toLocaleDateString()
      : "-"
    }`
  );

  // =========================
  // 2. HEAVY METAL CONCENTRATIONS
  // =========================

  drawSectionTitle(
    "2. HEAVY METAL CONCENTRATIONS"
  );

  const concentrationColumns = [
    {
      title: "Metal",
      width: 180,
    },
    {
      title: "Concentration",
      width: 180,
    },
    {
      title: "Unit",
      width: 140,
    },
  ];

  drawTableHeader(
    concentrationColumns
  );

  metals.forEach((metal) => {

    drawTableRow(
      [
        metalNames[metal],
        sample?.[metal],
        "mg/L",
      ],
      concentrationColumns
    );
  });

  // =========================
  // 3. POLLUTION INDICES
  // =========================

  drawSectionTitle(
    "3. POLLUTION INDICES"
  );

  const indexColumns = [
    {
      title: "Index",
      width: 120,
    },
    {
      title: "Calculated Value",
      width: 150,
    },
    {
      title: "Status",
      width: 235,
    },
  ];

  drawTableHeader(indexColumns);

  drawTableRow(
    [
      "HPI",
      assessment.hpi,
      assessment.hpiStatus,
    ],
    indexColumns
  );

  drawTableRow(
    [
      "MI",
      assessment.mi,
      assessment.miStatus,
    ],
    indexColumns
  );

  drawTableRow(
    [
      "PLI",
      assessment.pli,
      assessment.pliStatus,
    ],
    indexColumns
  );

  // =========================
  // 4. CONTAMINATION FACTOR
  // =========================

  drawSectionTitle(
    "4. CONTAMINATION FACTOR (CF)"
  );

  const cfColumns = [
    {
      title: "Metal",
      width: 150,
    },
    {
      title: "CF Value",
      width: 120,
    },
    {
      title: "Contamination Status",
      width: 235,
    },
  ];

  drawTableHeader(cfColumns);

  metals.forEach((metal) => {
    drawTableRow(
      [
        metalNames[metal],
        assessment.cf?.[metal],
        assessment.cfStatus?.[metal],
      ],
      cfColumns
    );
  });

  // =========================
  // 5. IGEO
  // =========================
  doc.addPage();


  drawSectionTitle(
    "5. GEO-ACCUMULATION INDEX (IGEO)"
  );

  const igeoColumns = [
    {
      title: "Metal",
      width: 150,
    },
    {
      title: "Igeo Value",
      width: 120,
    },
    {
      title: "Pollution Status",
      width: 235,
    },
  ];

  drawTableHeader(igeoColumns);

  metals.forEach((metal) => {
    drawTableRow(
      [
        metalNames[metal],
        assessment.igeo?.[metal],
        assessment.igeoStatus?.[metal],
      ],
      igeoColumns
    );
  });

  // =========================
  // 6. FINAL RISK SUMMARY
  // =========================

  doc.x = 40;
  drawSectionTitle(
    "6. FINAL RISK SUMMARY"
  );

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .text(
      `Overall Risk Level: ${assessment.overallRisk || "-"
      }`,
      40
    );

  doc.moveDown();

  doc.x = 40;

  doc
    .font("Helvetica")
    .fontSize(10)
    .text(
      "The final risk level is generated after evaluating the calculated pollution indices and their corresponding threshold-based classifications."
    );

  // =========================
  // 7. RECOMMENDATIONS
  // =========================

  doc.x = 40;
  drawSectionTitle(
    "7. RECOMMENDATIONS"
  );

  doc
    .font("Helvetica")
    .fontSize(10);

  if (
    assessment.recommendations &&
    assessment.recommendations.length > 0
  ) {
    assessment.recommendations.forEach(
      (recommendation, index) => {
        doc.text(
          `${index + 1}. ${recommendation}`,
          40
        );

        doc.moveDown(0.4);
      }
    );
  } else {
    doc.text(
      "No recommendations available."
    );
  }

  // =========================
  // FOOTER
  // =========================

  doc.moveDown(2);

  const footerY = doc.y;

  doc
    .moveTo(40, footerY)
    .lineTo(555, footerY)
    .stroke();

  doc.moveDown(0.5);

  doc
    .font("Helvetica")
    .fontSize(8)
    .text(
      `Generated on: ${new Date().toLocaleString()}`,
      {
        align: "right",
      }
    );

  doc.text(
    "Heavy Metal Water Pollution Assessment System",
    {
      align: "center",
    }
  );

  doc.end();
};

module.exports = {
  generatePDF,
};