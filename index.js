import * as tf from '@tensorflow/tfjs'; //import * as tf from '@tensorflow/tfjs-node' for better performance on laptop
import * as dfd from 'danfojs-node';
import { unNorm, norm, wattsToPace, paceToWatts } from './utils.js';
import { prepareTrainingSet, createModel, trainModel, checkAccuracy } from './modelCreation.js';

/* ---------- Make Single Prediction ---------- */
function prediction(fifteenHun, fifteenHunRate, reps, weight, age, twokRate, maxes, mins, model) {
  //Normalise Input
  const fifteenHunNorm = norm(maxes, mins, fifteenHun / fifteenHunRate, 2);
  const weightNorm = norm(maxes, mins, weight, 3);
  const ageNorm = norm(maxes, mins, age, 4);
  const repsNorm = norm(maxes, mins, reps, 5);
  // create tensor
  const testTensor = tf.tensor([[fifteenHunNorm, weightNorm, ageNorm, repsNorm]]);
  // predict 2k
  const twokPredictionNorm = model.predict(testTensor); // in watts per stroke
  // unNorm
  const twokPrediction = unNorm(maxes, mins, twokPredictionNorm.dataSync(), 1);
  // find avg watts & 2k rate (default 34)
  const avgWatts = twokPrediction * twokRate;
  return avgWatts;
}

/* ---------- Weekly Prediction ---------- */
async function weeklyPrediction(fileName, maxes, mins, model) {
  const dfpredict = await dfd.readCSV(fileName);
  const data = dfpredict.iloc({ columns: [`2:`] });

  //console.log(data.$columns);

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
  // adds column to data frame and saves csv file with results
  dfpredict.addColumn('twoKPredictions', twoK, { inplace: true });
  dfd.toCSV(dfpredict, { filePath: './data/weekPredictions-Complete.csv' });
}

/* ---------- Main ---------- */
async function run() {
  const trainName = './data/Predict-1500-clean Rev2.csv';
  const rd = await prepareTrainingSet(trainName); // ready data

  const model = createModel(rd.trainX);
  model.summary();

  const numEpochs = 150;
  await trainModel(model, numEpochs, rd.trainX, rd.trainY, rd.testX, rd.testY);

  checkAccuracy(model, rd.testX, rd.testY, rd.mins, rd.maxes, rd.testSize);

  // prediciton(1500 avg watts, rate, reps, wight, age, 2k Rate)
  // const twoKWatts = prediction(130, 22, 10, 73, 24, 32, rd.maxes, rd.mins, model);
  // console.log(wattsToPace(twoKWatts));

  const predictName = './data/weekPredictions.csv';
  await weeklyPrediction(predictName, rd.maxes, rd.mins, model);
}

run();
