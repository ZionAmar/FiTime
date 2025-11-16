const express = require("express");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const path = require("path");
const errorHandler = require("./middlewares/errorHandler");
const cors = require("cors");
const participantService = require('./services/participant_S'); // 1. ודא שהסרוויס מיובא
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4060;

app.use(cors({
  origin: ["http://localhost:3000","https://fitime.co.il"],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use("/api", require("./routes/index"));

app.use(express.static(path.join(__dirname, "../client/build")));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});


app.use(errorHandler);
participantService.startWaitingListCronJob();
app.listen(PORT, () => {
  console.log(`✅ EasyFit server is running at http://localhost:${PORT}`);
});