// TITLE: Prepare Data, Create Model, Train Model & Check Accuracy of Model
// DESCRIPTION: Taking out the model creation and training from index.js and importing them in as a ES6 Module
// TODO:

import * as tf from '@tensorflow/tfjs'; // or import * as tf from '@tensorflow/tfjs-node' when on mac;
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

/* -------------- Create the model -------------- */
function createModel(trainX) {
  // Create a sequential model and set its parameters
  const model = tf.sequential();
  model.add(
    tf.layers.dense({
      inputShape: [trainX.shape[1]],
      units: 24,
      activation: 'relu',
      kernelInitializer: 'heNormal',
    })
  );
  model.add(tf.layers.dense({ units: 24, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 12, activation: 'relu' }));
  model.add(
    tf.layers.dense({
      units: 1,
      activation: 'sigmoid',
    })
  );

  return model;
}

/* ---------- Train the Model ---------- */
async function trainModel(model, numEpochs, trainX, trainY, testX, testY) {
  const learningRate = 0.001;
  model.compile({
    optimizer: tf.train.adam(learningRate),
    loss: 'meanSquaredError',
    metrics: ['accuracy'],
  });

  // Train the model
  return await model.fit(trainX, trainY, {
    batchSize: 32,
    epochs: numEpochs,
    validationData: [testX, testY],
  });
}

/* -------------- Predict from the Model ---------------- */
function checkAccuracy(model, testX, testY, mins, maxes, testSize) {
  let sum = 0;

  for (let testIndex = 0; testIndex < testSize; testIndex++) {
    const tester = tf.tensor([testX.arraySync()[testIndex]]);
    const results = model.predict(tester);
    const singleResult = results.arraySync()[0];
    const acca =
      ((testY.arraySync()[testIndex] - singleResult) /
        testY.arraySync()[testIndex]) *
      100;
    //console.log(acca.toFixed(2) + ' % error');

    const accaPositive = Math.sqrt(acca ** 2);
    if (accaPositive != Infinity) {
      sum = sum + accaPositive;
    }
  }
  // Print accuracy %
  console.log((sum / testSize).toFixed(2) + '% error');
}

export { prepareTrainingSet, createModel, trainModel, checkAccuracy };
