const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const sampleRoutes = require("./routes/sampleRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const reportRoutes = require("./routes/reportRoutes"); 
const whoIndicesRoutes = require("./routes/whoIndicesRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const adminRoutes = require("./routes/adminRoutes");
const standardsRoutes = require("./routes/standardsRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const mapRoutes = require("./routes/mapRoutes");
dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/samples", sampleRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/assessment", assessmentRoutes);
app.use("/api/standards", standardsRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/map", mapRoutes);
app.use("/api/reports", reportRoutes);
app.use(
  "/api/who-indices",
  whoIndicesRoutes
);
app.use(
  "/api/dashboard",
  dashboardRoutes
);
app.use(
  "/api/admin",
  adminRoutes
);


app.get("/", (req, res) => {
  res.send("Heavy Metal Water Pollution Assessment System API Running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});