const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 8080;

require("./config/db_connection");

const bleRssiRouter = require("./src/routers/bleRssi");

const cronJob = require("./src/scripts/crons");

app.use(express.json({ limit: "10mb", extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());


app.use("/", bleRssiRouter);



app.listen(port, () => {
  console.log(`Server is up and running at PORT: ${port}`);
});


cron.schedule("* * * * *", () => cronJob(process.argv[2]));
