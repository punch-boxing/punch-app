import {
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import {
  Button,
  View,
  Text,
  Vibration,
} from 'react-native';
import { Subscription } from 'rxjs';
import { accelerometer, gyroscope, setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';
// import * as tf from '@tensorflow/tfjs';
// import { bundleResourceIO } from '@tensorflow/tfjs-react-native';
// import Sound from 'react-native-sound';


import { Vector3D } from './src/utils/vector';
import { autoCalibrate, initializeOrientaion } from './src/utils/math';

const timeInterval = 50; // ms
const modelList = ['GRU_5D_2L_20W', 'GRU_5D_3L_20W', 'GRU_5D_4L_20W'];

function App() {
  // const [, forceUpdate] = useReducer(x => x + 1, 0);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [modelIndex, setModelIndex] = useState<number>(0);
  const orientationInitialized = useRef<boolean>(false);
  const acceleration = useRef<Vector3D>(new Vector3D(0, 0, 0));
  const orientation = useRef<Vector3D>(new Vector3D(0, 0, 0));
  // const punchDetector = useRef<tf.LayersModel | null>(null);

  // useEffect(() => {
  //   const loadModel = async () => {
  //     await tf.ready();
  //     const modelJson = require('./assets/models/GRU_5D_4L_10W/model.json');
  //     const modelWeights = require('./assets/models/GRU_5D_4L_10W/group1-shard1of1.bin');
  //     const model = await tf.loadLayersModel(bundleResourceIO(modelJson, modelWeights));
  //     punchDetector.current = model;
  //     if (punchDetector) {
  //       console.log('Model loaded successfully');
  //     } else {
  //       console.error('Failed to load model');
  //     }
  //   };
  //   loadModel().catch(err => {
  //     console.error('Failed to load model:', err);
  //   });
  // }, []);

  const startSensor = () => {
    if (!subscription) {
      let _gyro: Vector3D = new Vector3D(0, 0, 0);

      setUpdateIntervalForType(SensorTypes.gyroscope, timeInterval);
      setUpdateIntervalForType(SensorTypes.accelerometer, timeInterval);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const gyroSubscription = gyroscope.subscribe(({ x, y, z }) => {
        _gyro = new Vector3D(x, 0, z);
      });

      const accelSubscription = accelerometer.subscribe(async ({ x, y, z }) => {
        if (!orientationInitialized.current) {
          orientation.current = initializeOrientaion(new Vector3D(x, y, z));
          acceleration.current = new Vector3D(x, y, z);
          orientationInitialized.current = true;
          // const inputTensor = tf.tensor3d([[[acceleration.current.x, acceleration.current.y, acceleration.current.z, orientation.current.x, orientation.current.z]]]);
          // punchDetector.current?.predict(inputTensor);
          // inputTensor.dispose();
        } else {
          let result = autoCalibrate(new Vector3D(x, y, z), _gyro, orientation.current, timeInterval);
          orientation.current = result.orientation;
          acceleration.current = result.acceleration;
          // const inputTensor = tf.tensor3d([[[acceleration.current.x, acceleration.current.y, acceleration.current.z, orientation.current.x, orientation.current.z]]]);
          // try {
          //   const prediction = punchDetector.current?.predict(inputTensor) as tf.Tensor;
          //   // console.log(prediction);
          //   if (prediction) {
          //     const predictionData = await prediction.data();
          //     const maxPrediction = Math.max(...predictionData);
          //     const maxIndex = predictionData.indexOf(maxPrediction);
          //     console.log('Max Index:', maxIndex, 'Max Value:', maxPrediction);
          //     if (maxIndex !== 0 && maxPrediction > 0.6) {
          //       // if (maxIndex === 1) {
          //       //   const straightSound = new Sound(StraightSound, (error) => {
          //       //     if (error) {
          //       //       console.error('Failed to load sound:', error);
          //       //     } else {
          //       //       straightSound.play();
          //       //     }
          //       //   });
          //       // } else if (maxIndex === 2) {
          //       // } else if (maxIndex === 3) {
          //       // } else if (maxIndex === 4) {
          //       // }
          //       Vibration.vibrate(100);
          //     }
          //     prediction.dispose();
          //   }
          // } catch (error) {
          //   console.error('Error during prediction:', error);
          // }
          // inputTensor.dispose();
        }
      });

      const combinedSubscription = new Subscription();
      combinedSubscription.add(gyroSubscription);
      combinedSubscription.add(accelSubscription);
      setSubscription(combinedSubscription);
    }
  };

  const stopSensor = () => {
    if (subscription) {
      subscription.unsubscribe();
      orientationInitialized.current = false;
      setSubscription(null);
    }
  };

  return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 24 }}>
        <Button title="Start Model" onPress={startSensor} />
        <Button title="Stop Model" onPress={stopSensor} />
        {/* <Button title="Change Model" onPress={async () => {
          const nextIndex = (modelIndex + 1) % modelList.length;
          setModelIndex(nextIndex);
          try {
            const modelJson = require(`./assets/models/${modelList[nextIndex]}/model.json`);
            const modelWeights = require(`./assets/models/${modelList[nextIndex]}/group1-shard1of1.bin`);
            const model = await tf.loadLayersModel(bundleResourceIO(modelJson, modelWeights));
            punchDetector.current = model;
            console.log('Model changed to:', modelList[nextIndex]);
          } catch (err) {
            console.error('Failed to load new model:', err);
          }
        }} /> */}
      </View>
    );
}

export default App;
