const axios = require("axios")

const trilat = require("trilat");
const kalmanFilter = require("kalmanjs");

const coordinateHelperApi = require("../lib/api").coordinateHelperApi;
const rssiValueApi = require("../lib/api").rssiValueApi;
const rssiValueMacIdApi = require("../lib/api").rssiValueMacIdApi;

const parseDate = require("../lib/common_utils").parseDate;
const conn = require("../../config/db_connection");
let sampleData = require("../lib/sample_macid_data.json");
const constants = require("../lib/constants");


const getRssiValues = async () => {
  const rssiValues = await axios.get(rssiValueApi);
  let rssiData = rssiValues.data.data;
  rssiData.sort( (obj1, obj2) => {
    const key1 = Object.keys(obj1)[0];
    const key2 = Object.keys(obj2)[0];
    return (key1 < key2) ? 1 : (key1 > key2) ? -1 : 0;
  });
  let recentRssiData = {};
  rssiData.forEach (timestamp => {
    const deviceDataArray = Object.values(timestamp)[0];
    deviceDataArray.forEach(deviceItem => {
      deviceItem.data.forEach(singleDeviceData => {
        const deviceId = singleDeviceData.deviceId;
        const rssiValue = singleDeviceData.rssi;
        let rssiDeviceData = {};
        if (recentRssiData.hasOwnProperty(deviceItem.id)) { 
          rssiDeviceData = recentRssiData[deviceItem.id];
        }
        if (!rssiDeviceData.hasOwnProperty(deviceId)) {
          rssiDeviceData[deviceId] = rssiValue;
        }
        recentRssiData[deviceItem.id] = rssiDeviceData;
      });
    })
  })
  const timestamp = parseDate(Object.keys(rssiData[0])[0]);
  return {recentRssiData, timestamp};
};


const getRssiValuesByMacId = async () => {
  const rssiValues = await axios.get(rssiValueMacIdApi);
  let rssiData = rssiValues.data.data;
  const mapid = rssiValues.data.mapid;
  let recentRssiData = {};
  let timestamp = "";
  recentRssiData.mapid = mapid;
  rssiData.forEach(beacon => {
    const beaconId = Object.keys(beacon)[0];
    const beaconData = beacon[beaconId];
    beaconData.sort((beacon1, beacon2) => {
      return (beacon1.timestamp) < (beacon2.timestamp) ? 1 : -1;
    });
    let rssiDeviceData = {};
    beaconData.forEach (deviceData => {
      const deviceId = deviceData.deviceId;
      const deviceTimestamp = deviceData.timestamp;
      if (deviceTimestamp > timestamp) {
        timestamp = deviceTimestamp;
      }
      if (!rssiDeviceData.hasOwnProperty(deviceId)) {
        rssiDeviceData[deviceId] = deviceData.rssi;
      }
    });
    recentRssiData[beaconId] = rssiDeviceData;
  });
  return {recentRssiData, timestamp};
};


const rssiToDistance = (rssi, anchor) => {
  return Math.pow(10, ((constants.measured_power - rssi)/(10.0 * constants.environment_factor[anchor - 1])));
}


const trilateration = async (request) => {
  const kFilter = new kalmanFilter();
  const rssiValues = [ 
                      kFilter.filter(request.rssiValues.anchor_1),
                      kFilter.filter(request.rssiValues.anchor_2),
                      kFilter.filter(request.rssiValues.anchor_3)
                     ];
  const distances = [rssiToDistance(rssiValues[0], 1), rssiToDistance(rssiValues[1], 2), rssiToDistance(rssiValues[2], 3)];
  const anchors = [ 
                    [constants.anchor_1[0], constants.anchor_1[1], distances[0]],
                    [constants.anchor_2[0], constants.anchor_2[1], distances[1]],
                    [constants.anchor_3[0], constants.anchor_3[1], distances[2]]
                  ]

  const coordinateValues = trilat(anchors);
  const coordinates = {
    x: coordinateValues[0],
    y: coordinateValues[1]
  };

  return coordinates;
}


const getCoordinates = async (rssiData, timestamp) => {
  timestamp = parseDate(timestamp);
  for(let beacon in rssiData) {
    if (Object.keys(rssiData[beacon]).length !== 3) {
      continue;
    } 
    const request = {
      "rssiValues": { 
        "anchor_1": rssiData[beacon].gw1001.toString(),
        "anchor_2": rssiData[beacon].gw1002.toString(),
        "anchor_3": rssiData[beacon].gw1003.toString(),
      }
    };
    const coordinates = await trilateration(request);
    rssiData[beacon].coordinates = coordinates;
    const statement = "INSERT INTO `history` (`dmac`, `mapid`, `latitude`, `longitude`) VALUES (?, ?, ?, ?)";
    const fields = [beacon, rssiData.mapid, rssiData[beacon].coordinates.x, rssiData[beacon].coordinates.y];
    try {
      const res = await conn.query(statement, fields);
      console.log(`X ${coordinates.x} and Y ${coordinates.y} coordinates at ${timestamp} for beacon ${beacon} inserted in database`);
    } catch (err) {
      throw err;
    }
  }
  rssiData.timestamp = timestamp;
  return rssiData;
};



module.exports = {getCoordinates, getRssiValues, getRssiValuesByMacId};