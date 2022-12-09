import * as df from 'danfojs-node';

// const df = await dfd.readExcel('./data/Predict-1500 Rev1.xlsx', {
//   sheet: '1500s',
// });

// df.print();
async function readAndPrintXlsxFile(filePath) {
  // Read in the .xlsx file using 'danfo.js'
  const dataFrame = await df.readExcel(filePath);

  // Print the contents of the data frame to the terminal
  console.log(dataFrame.toString());
}

readAndPrintXlsxFile('./data/Predict-1500 Rev1.xlsx', { sheet: '1500s' });
