const express = require("express");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const errorHandler = require("./middlewares/errorHandler");
const cors = require("cors");
const participantService = require('./services/participant_S');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4060;

app.use(compression());
app.use(cors({
  origin: ["http://localhost:3000","https://fitime.co.il"],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use("/api", require("./routes/index"));

const buildPath = path.join(__dirname, "../client/build");
app.get('/service-worker.js', (req, res) => {
    const swPath = path.join(buildPath, 'service-worker.js');
        if (fs.existsSync(swPath)) {
        res.sendFile(swPath);
    } else {
        res.status(404).send('Service Worker not found.');
    }
});

app.use(express.static(buildPath));
app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
});
app.use(errorHandler);
participantService.startWaitingListCronJob();
app.listen(PORT, () => {
  console.log(`✅ FiTime server is running at http://localhost:${PORT}`);
});