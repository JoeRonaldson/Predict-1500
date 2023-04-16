# Predit-1500

This is the MVP code for a prediction app that takes in several features and outputs a predicted score. It uses a machine learning regression model to do this.

# Use Case

The 2,000m (2k) ergometer (erg) test in rowing is the gold standard in measuring physiological performance in athletes. The test scores are used in the selection process and with experienced rowers can generally be linked with on the water rowing performance (this can be debated).
Like any maximal effort test, few are done throughout the season due to the toll it can take on the body and the interruptions it causes to training. In a typical season, an athlete may only do two 2k erg tests. Thus for a coach, it can be hard to gauge an athlete's peak physiological ability outside of certain times in the season.

The use case for this code solves the problem by using an athlete's score in a particular weekly training session to predict their potential 2k erg score based on four years of data collected.

# How It Works

### The Data Set

The training data set is made up of scores produced on a standardised training session completed over four years. The age and weight of the athlete were also collected each time they completed the training session as well as other features like stroke rate and the number of repititions (pieces) completed. For each data entry, the athlete's most recent 2k erg score was added as the target variable.

### Data Cleaning & Manilpulation

The data set was sepearated into training and testing sets after being normalised.

### The Model

A neural network model defined using TensorFlow's sequential API was used. It consists of an input layer, three hidden layers with ReLU activation, and an output layer with sigmoid activation. The hidden layers have 6, 12, and 6 units respectively and use the He normal weight initialization.

### The Results

The model produced an error of 20%. For the purpose of this MVP experiment, this was deemed a success and a proof of concept.

### Conclusion

A decision tree approach may lead to better results in the future as well as a larger data set.
