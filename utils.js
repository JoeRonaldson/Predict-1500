/**

 * @fileOverview Taking out the utility functions from index.js and importing them in as an ES6 Module
 * @author Joe Ronaldson
 */

/**
 
 * Un-normalises a value given its min and max ranges.
 * @function
 * @param {Object} maxes - Object containing the maximum values.
 * @param {Object} mins - Object containing the minimum values.
 * @param {number} value - The value to un-normalise.
 * @param {number} index - The index used to access min and max values in 'mins' and 'maxes' objects.
 * @returns {number} The un-normalised value.
 */
function unNorm(maxes, mins, value, index) {
  const unNorm = value * (maxes['$data'][index] - mins['$data'][index]) + mins['$data'][index];
  return unNorm;
}

/**

 * Normalises a value given its min and max ranges.
 * @function
 * @param {Object} maxes - Object containing the maximum values.
 * @param {Object} mins - Object containing the minimum values.
 * @param {number} value - The value to normalise.
 * @param {number} index - The index used to access min and max values in 'mins' and 'maxes' objects.
 * @returns {number} The normalised value.
 */
function norm(maxes, mins, value, index) {
  const norm = (value - mins['$data'][index]) / (maxes['$data'][index] - mins['$data'][index]);
  return norm;
}

/**

 * Converts watts to pace (time per 500 meters).
 * @function
 * @param {number} watts - The power in watts.
 * @returns {string} The pace in the format "mm:ss.t", where mm is minutes, ss is seconds, and t is tenths of a second.
 */
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

/**

 * Converts pace (time per 500 meters) to watts.
 * @function
 * @param {string} pace - The pace in the format "mm:ss.t", where mm is minutes, ss is seconds, and t is tenths of a second.
 * @returns {number} The power in watts.
 */
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
