// TITLE: Utility Functions
// DESCRIPTION: Taking out the utility functions from index.js and importing them in as a ES6 Module
// TODO:

/* ---------- Normaliseing Fuctions (Utility Functions)---------- */
// Un-normalise x = y(max - min) + min;
function unNorm(maxes, mins, value, index) {
  const unNorm = value * (maxes['$data'][index] - mins['$data'][index]) + mins['$data'][index];
  return unNorm;
}

// Un-normalise y = (x – min) / (max – min)
function norm(maxes, mins, value, index) {
  const norm = (value - mins['$data'][index]) / (maxes['$data'][index] - mins['$data'][index]);
  return norm;
}

/* ---------- watts to Pace conversion (Utility Functions)---------- */
function wattsToPace(watts) {
  const pace = Math.pow(2.8 / watts, 1 / 3) * 500; // seconds per 500m

  const minutes = Math.floor(pace / 60);
  const seconds = (pace % 60).toFixed(1);

  function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
  }
  const result = `${padTo2Digits(minutes)}:${padTo2Digits(seconds)}`;

  return result;
}

// converts pace to watts (used GPT-3 to write this function)
function paceToWatts(pace) {
  // split pace into minutes and seconds
  const [minutes, seconds] = pace.split(':');

  // convert minutes and seconds to total number of seconds
  const totalSeconds = parseInt(minutes) * 60 + parseFloat(seconds);

  // calculate watts
  const watts = 2.8 / Math.pow(totalSeconds / 500, 3);

  return watts;
}

export { unNorm, norm, wattsToPace, paceToWatts };
