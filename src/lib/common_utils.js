const responseUtil = (status, data, message) => {
  return {
    status: status,
    data: data,
    message: message
  };
};

const helperDate = (dateItem) => {
  return (dateItem.length == 2) ? dateItem : `0${dateItem}`;
}

const parseDate = (timestamp) => {
  const year = timestamp.split("-")[0];
  const month = timestamp.split("-")[1];
  const date = (timestamp.split("-")[2]).split("&")[0];
  const hour = (timestamp.split("&")[1]).split(":")[0];
  const minute = (timestamp.split("&")[1]).split(":")[1];
  const second = ((timestamp.split("&")[1]).split(":")[2]).split("+")[0];
  const newDate = (year) + (`-`) + helperDate(month) + (`-`) + helperDate(date) + (` `) + helperDate(hour) + (`:`) + helperDate(minute) + (`:`) + helperDate(second);
  return newDate; 
}

module.exports = {responseUtil, parseDate};