function wattsToPace(watts) {
  const pace = Math.pow(2.8 / watts, 1 / 3) * 500; // seconds per 500m

  const minutes = Math.floor(pace / 60);
  const seconds = (pace % 60).toFixed(2);

  function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
  }

  const result = `${padTo2Digits(minutes)}:${padTo2Digits(seconds)}`;

  return result;
}

console.log(wattsToPace(300));
