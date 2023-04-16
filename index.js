/**

@fileOverview This module provides functionality for predicting rowing performance based on various input factors.
@author Joe Ronaldosn
*/
// import * as tf from '@tensorflow/tfjs-node';
// import * as dfd from 'danfojs-node';
import * as dfd from 'danfojs-node';
const tf = dfd.tensorflow; //Tensorflow.js is exportedfrom Danfojs
import { unNorm, norm, wattsToPace, paceToWatts } from './utils.js';
import { prepareTrainingSet, createModel, trainModel, checkAccuracy } from './modelCreation.js';

/**

Makes a single prediction of the average watts for a 2k row using the provided input factors.
@function
@param {number} fifteenHun - The average watts for a 1500m row.
@param {number} fifteenHunRate - The stroke rate for the 1500m row.
@param {number} reps - The number of repetitions performed.
@param {number} weight - The weight of the rower in kg.
@param {number} age - The age of the rower.
@param {number} twokRate - The stroke rate for the 2k row.
@param {Array<number>} maxes - The maximum values for normalisation.
@param {Array<number>} mins - The minimum values for normalisation.
@param {tf.Sequential} model - The trained TensorFlow model.
@returns {number} The predicted average watts for a 2k row.
*/
function prediction(fifteenHun, fifteenHunRate, reps, weight, age, twokRate, maxes, mins, model) {
  // Normalise Input
  const fifteenHunNorm = norm(maxes, mins, fifteenHun / fifteenHunRate, 2);
  const weightNorm = norm(maxes, mins, weight, 3);
  const ageNorm = norm(maxes, mins, age, 4);
  const repsNorm = norm(maxes, mins, reps, 5);
  // Create tensor
  const testTensor = tf.tensor([[fifteenHunNorm, weightNorm, ageNorm, repsNorm]]);
  // Predict 2k
  const twokPredictionNorm = model.predict(testTensor); // in watts per stroke
  // Un-normalise
  const twokPrediction = unNorm(maxes, mins, twokPredictionNorm.dataSync(), 1);
  // Find avg watts & 2k rate (default 34)
  const avgWatts = twokPrediction * twokRate;
  return avgWatts;
}

/**

Batch predicts rowing performance.
Takes a csv file in with each atheletes parameteres and saves an updated csv with predicted 2k score appended.
@async
@function
@param {string} fileName - The path to the CSV file containing input data.
@param {Array<number>} maxes - The maximum values for normalisation.
@param {Array<number>} mins - The minimum values for normalisation.
@param {tf.Sequential} model - The trained TensorFlow model.
@returns {Promise<void>} - A promise that resolves once the function has completed execution.
*/
async function batchPrediction(fileName, maxes, mins, model) {
  const dfpredict = await dfd.readCSV(fileName);
  const data = dfpredict.iloc({ columns: ['2:'] });

  let twoK = [];
  for (let x = 0; x < data.$data.length; x++) {
    let twoKWatts = prediction(
      data.$data[x][0], //'watts',
      data.$data[x][1], //'rate'
      data.$data[x][2], //'reps'
      data.$data[x][3], //'weight'
      data.$data[x][4], //'age'
      data.$data[x][5], //'twoKrate'
      maxes,
      mins,
      model
    );
    twoK.push(wattsToPace(twoKWatts));
  }
  // Adds column to data frame and saves csv file with results
  dfpredict.addColumn('twoKPredictions', twoK, { inplace: true });
  dfd.toCSV(dfpredict, { filePath: './data/batchPredictionsComplete.csv' });
}

/**

Main function that runs the entire process from preparing the training set to making predictions.
@async
@function
@returns {Promise<void>} - A promise that resolves once the function has completed execution.
*/
async function run() {
  const trainName = './data/cleanedData.csv';
  const rd = await prepareTrainingSet(trainName); // Ready data
  const model = createModel(rd.trainX);
  model.summary();

  const numEpochs = 150;
  await trainModel(model, numEpochs, rd.trainX, rd.trainY, rd.testX, rd.testY);

  // TODO: Look at the variable 'model' and how it changes from the initialised model to the trained model

  // await model.save('file://./model/'); // Saves the model

  checkAccuracy(model, rd.testX, rd.testY, rd.mins, rd.maxes, rd.testSize);

  // prediciton(1500 avg watts, rate, reps, wight, age, 2k Rate)
  const twoKWatts = prediction(130, 22, 10, 73, 24, 32, rd.maxes, rd.mins, model);
  // console.log(wattsToPace(twoKWatts));

  const predictName = './data/batchPredictions.csv';
  await batchPrediction(predictName, rd.maxes, rd.mins, model);
}

run();
