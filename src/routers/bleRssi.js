const express = require("express");


const router = new express.Router();


const bleRssiHelper = require("../controllers/bleRssi");
const commonUtils = require("../lib/common_utils");


router.get("/", async (req, res) => {
  try {
    res.send(commonUtils.responseUtil(200, null, "Node API working fine"));
  } catch (err) {
    console.log(err);
    res.send(commonUtils.responseUtil(500, null, err.message));
  }
})


router.post("/get-coordinates", async (req, res) => {
  try {
    const {recentRssiData: rssiData, timestamp} = await bleRssiHelper.getRssiValues();
    const coordinates = await bleRssiHelper.getCoordinates(rssiData, timestamp);
    res.send(commonUtils.responseUtil(200, coordinates, `X and Y coordinates at ${timestamp}`));
  } catch (err) {
    console.log(err);
    res.send(commonUtils.responseUtil(500, null, err.message));
  }
});


router.post("/get-coordinates-macid", async (req, res) => {
  try {
    const {recentRssiData: rssiData, timestamp} = await bleRssiHelper.getRssiValuesByMacId();
    const coordinates = await bleRssiHelper.getCoordinates(rssiData, timestamp);
    res.send(commonUtils.responseUtil(200, coordinates, `X and Y coordinates at ${timestamp}`));
  } catch (err) {
    console.log(err);
    res.send(commonUtils.responseUtil(500, null, err.message));
  }
});


module.exports = router;
