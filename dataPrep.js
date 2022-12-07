import * as tf from '@tensorflow/tfjs-node';
import * as dfd from 'danfojs-node';

/* ------------- Preparing the Data Set-------------- */
async function prepareTrainingSet(fileName) {
  // Load the training CSV file as a data frame
  const dfOG = await dfd.readCSV(fileName);
  //console.log('Train Size', dfOG.shape[0]);

  // Stores the data frame's Mins and Maxes of each column
  const mins = dfOG.min({ axis: 0 });
  const maxes = dfOG.max({ axis: 0 });

  // Normalising the data frame
  let scaler = new dfd.MinMaxScaler();
  scaler.fit(dfOG);
  let df = scaler.transform(dfOG);

  // Create the training and test set
  const testSize = 25;
  const newTest = await df.sample(testSize);
  console.log(`newTest Row count: ${newTest.shape[0]}`);
  // The rest to testing (drop via row index)
  const newTrain = df.drop({ index: newTest.index, axis: 0 });
  console.log(`newTrain row count: ${newTrain.shape[0]}`);

  // Write the test and train data set to CSV files
  dfd.toCSV(newTrain, { filePath: './data/newTrain.csv' });
  dfd.toCSV(newTest, { filePath: './data/newTest.csv' });
  console.log('Files written!');

  // Read in the train and test data set into data frames
  const df1 = await dfd.readCSV('./data/newTrain.csv');
  //console.log('Train Size', df1.shape[0]);
  const dft1 = await dfd.readCSV('./data/newTest.csv');

  // Split train into Xs (Features) and Ys (Labels)
  const trainX = df1.iloc({ columns: [`2:`] }).tensor; // use columns: [`1:`] if no idex column
  const trainY = df1['two-k'].tensor;

  // Split test into Xs (Features) and Ys (Labels)
  const testX = dft1.iloc({ columns: [`2:`] }).tensor; // use columns: [`1:`] if no idex column
  const testY = dft1.column('two-k').tensor;

  return { trainX, trainY, testX, testY, mins, maxes, testSize };
}
