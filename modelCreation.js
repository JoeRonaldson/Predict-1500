/**

@fileOverview This module provides functionality for preparing the data set, creating, training, and checking the accuracy of a TensorFlow model for predicting rowing performance.
@author Joe Ronaldson
*/
import * as tf from '@tensorflow/tfjs';
import * as dfd from 'danfojs-node';

/**

Asynchronously prepares the training set from a given CSV file.
@async
@function
@param {string} fileName - The path to the CSV file containing the input data.
@returns {Promise<Object>} An object containing the training and test data sets, and their min and max values.
*/
async function prepareTrainingSet(fileName) {
  // Load the training CSV file as a data frame
  const dfOG1 = await dfd.readCSV(fileName);
  //console.log('Train Size', dfOG.shape[0]);
  const dfOG = await dfOG1.sample(dfOG1.shape[0]); //shuffles the data
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
  const trainX = df1.iloc({ columns: ['2:'] }).tensor; // use columns: [1:] if no idex column
  const trainY = df1['two-k'].tensor;

  // Split test into Xs (Features) and Ys (Labels)
  const testX = dft1.iloc({ columns: ['2:'] }).tensor; // use columns: [1:] if no idex column
  const testY = dft1.column('two-k').tensor;

  return { trainX, trainY, testX, testY, mins, maxes, testSize };
}

/**

Creates a sequential TensorFlow model.
@function
@param {tf.Tensor} trainX - The training input data.
@returns {tf.Sequential} The created TensorFlow model.
*/
function createModel(trainX) {
  // Create a sequential model and set its parameters
  const model = tf.sequential();
  model.add(
    tf.layers.dense({
      inputShape: [trainX.shape[1]],
      units: 6,
      activation: 'relu',
      kernelInitializer: 'heNormal',
    })
  );
  model.add(tf.layers.dense({ units: 12, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 6, activation: 'relu' }));
  model.add(
    tf.layers.dense({
      units: 1,
      activation: 'sigmoid',
    })
  );

  return model;
}

/**

Trains the TensorFlow model.
@async
@function
@param {tf.Sequential} model - The TensorFlow model to train.
@param {number} numEpochs - The number of epochs to train the model for.
@param {tf.Tensor} trainX - The training input data.
@param {tf.Tensor} trainY - The training output data.
@param {tf.Tensor} testX - The testing input data.
@param {tf.Tensor} testY - The testing output data.
@returns {Promise<tf.History>} A promise that resolves with the training history of the model.
*/
async function trainModel(model, numEpochs, trainX, trainY, testX, testY) {
  const learningRate = 0.0005;
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

/**

Checks the accuracy of the TensorFlow model using the test set.
@function
@param {tf.Sequential} model - The TensorFlow model to check the accuracy of.
@param {tf.Tensor} testX - The testing input data.
@param {tf.Tensor} testY - The testing output data.
@param {Object} mins - The minimum values of each feature in the data set.
@param {Object} maxes - The maximum values of each feature in the data set.
@param {number} testSize - The size of the test set.
*/
function checkAccuracy(model, testX, testY, mins, maxes, testSize) {
  let sum = 0;
  for (let testIndex = 0; testIndex < testSize; testIndex++) {
    const tester = tf.tensor([testX.arraySync()[testIndex]]);
    const results = model.predict(tester);
    const singleResult = results.arraySync()[0];
    const acca =
      ((testY.arraySync()[testIndex] - singleResult) / testY.arraySync()[testIndex]) * 100;
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
