const bleRssiHelper = require("../controllers/bleRssi");
const commonUtils = require("../lib/common_utils");

const cronJob = async (choice = 1) => {
  try {
    const rssiHelper = (choice == 1) ? bleRssiHelper.getRssiValuesByMacId : bleRssiHelper.getRssiValues;
    const {recentRssiData: rssiData, timestamp} = await rssiHelper();
    const coordinates = await bleRssiHelper.getCoordinates(rssiData, timestamp);
    if (coordinates.timestamp) {
      console.log(commonUtils.responseUtil(200, coordinates, `Success at ${timestamp}`));
    } else {
      console.log(commonUtils.responseUtil(200, coordinates, `X and Y coordinates at ${timestamp} not inserted in database`));
    }
  } catch (err) {
    console.log(err);
    console.log(commonUtils.responseUtil(500, null, err.message));
  }
};


module.exports = cronJob;