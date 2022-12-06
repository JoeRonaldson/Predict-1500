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

/* -------------- Predict from the Model ---------------- */
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

function paceToWatts() {}

/* ---------- Weekly Prediction ---------- */
async function weeklyPrediction(fileName, maxes, mins, model) {
  const dfpredict = await dfd.readCSV(fileName);
  const data = dfpredict.iloc({ columns: [`2:`] });

  console.log(data.$columns);

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

  // adds column to data frame and print
  dfpredict.addColumn('twoKPredictions', twoK, { inplace: true });
  dfd.toCSV(dfpredict, { filePath: './data/weekPredictions-Complete.csv' });
}

/* ---------- Main -------  --- */
async function run() {
  const trainName = './data/Predict-1500-clean Rev2.csv';
  const rd = await prepareTrainingSet(trainName); // ready data

  const model = createModel(rd.trainX);
  model.summary();

  const numEpochs = 50;
  await trainModel(model, numEpochs, rd.trainX, rd.trainY, rd.testX, rd.testY);

  checkAccuracy(model, rd.testX, rd.testY, rd.mins, rd.maxes, rd.testSize);

  // prediciton(1500 avg watts, rate, reps, wight, age, 2k Rate)
  //const twoKWatts = prediction(300, 22, 12, 85, 24, 34, rd.maxes, rd.mins, model);
  //console.log(wattsToPace(twoKWatts));

  const predictName = './data/weekPredictions.csv';
  await weeklyPrediction(predictName, rd.maxes, rd.mins, model);
}

run();
