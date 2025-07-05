import {
  useReducer,
  useRef,
  useState,
} from 'react';
import {
  Button,
  View,
  Share,
  Text,
  Vibration,
} from 'react-native';
import { Subscription } from 'rxjs';
import { VolumeManager } from 'react-native-volume-manager';
import { accelerometer, gyroscope, setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';
// import * as tf from '@tensorflow/tfjs';
// import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

import { Vector3D } from './src/utils/vector';
import { autoCalibrate, initializeOrientaion } from './src/utils/math';

const timeInterval = 50; // ms

function App() {
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  const data = useRef<string>('index,time,acc x,acc y,acc z,sin ori x,sin ori y,sin ori z,user input\n');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  // const [punchDetector, setPunchDetector] = useState<tf.LayersModel | null>(null);
  const orientationInitialized = useRef<boolean>(false);

  const acceleration = useRef<Vector3D>(new Vector3D(0, 0, 0));
  const orientation = useRef<Vector3D>(new Vector3D(0, 0, 0));

  const volumeListener = useRef<ReturnType<typeof VolumeManager.addVolumeListener> | null>(null);

  // try {
  //   const model = await require('./assets/models/gru-6d/model.json');
  //   console.log('Model loaded successfully:', model);
  //   const weight = await require('./assets/models/gru-6d/weight.bin');
  //   console.log('Weights loaded successfully:', weight);
  //   setPunchDetector(await tf.loadLayersModel(bundleResourceIO(model, weight)));
  // } catch (error) {
  //   console.error('Error loading model:', error);
  // }

  const startSensor = () => {
    if (!subscription) {
      let index = 0;
      let startTime: number | null = null;
      let _gyro: Vector3D = new Vector3D(0, 0, 0);
      let currentVolume = 0;

      setUpdateIntervalForType(SensorTypes.gyroscope, timeInterval);
      setUpdateIntervalForType(SensorTypes.accelerometer, timeInterval);

      let volumeChanged = 0;

      volumeListener.current = VolumeManager.addVolumeListener((result) => {
        if (currentVolume !== result.volume) {
          volumeChanged = 1;
        }
        currentVolume = result.volume;
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const gyroSubscription = gyroscope.subscribe(({ x, y, z }) => {
        _gyro = new Vector3D(x, 0, z);
      });

      const accelSubscription = accelerometer.subscribe(({ x, y, z, timestamp }) => {
        if (!orientationInitialized.current) {
          orientation.current = initializeOrientaion(new Vector3D(x, y, z));
          acceleration.current = new Vector3D(x, y, z);
          orientationInitialized.current = true;
          // punchDetector?.predict([acceleration.current.x, acceleration.current.y, acceleration.current.z, orientation.current.x, orientation.current.y, orientation.current.z]);
        } else {
          let result = autoCalibrate(new Vector3D(x, y, z), _gyro, orientation.current, timeInterval);
          orientation.current = result.orientation;
          acceleration.current = result.acceleration;
          // punchDetector?.predict([acceleration.current.x, acceleration.current.y, acceleration.current.z, orientation.current.x, orientation.current.y, orientation.current.z]).then((prediction) => {
          //   if (prediction[0] > 0.5) {
          //     Vibration.vibrate(100);
          //   }
          // });
        }

        if (startTime === null) {
          startTime = timestamp;
        }
        const elapsedTime = (timestamp - startTime) / 1000;
        data.current += `${index},${elapsedTime},${x},${y},${z},${Math.sin(orientation.current.x)},${Math.sin(orientation.current.y)},${Math.sin(orientation.current.z)},${volumeChanged}\n`;
        volumeChanged = 0;
        index++;
        forceUpdate();
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
    volumeListener.current?.remove();
  };

  return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 24 }}>
        <Text style={{ fontSize: 24 }}>Sensor Data Logger</Text>
        <Text>Accelerometer and Gyroscope</Text>
        <Text style={{color: 'white'}}>
          acceleration x : {acceleration.current.x.toFixed(2)} {'\n'}
          acceleration y : {acceleration.current.y.toFixed(2)} {'\n'}
          acceleration z : {acceleration.current.z.toFixed(2)} {'\n'}
          {'\n'}
          rotation x : {Math.sin(orientation.current.x).toFixed(2)} {'\n'}
          rotation y : {Math.sin(orientation.current.y).toFixed(2)} {'\n'}
          rotation z : {Math.sin(orientation.current.z).toFixed(2)}
        </Text>
        <Button title="Start Sensor" onPress={startSensor} />
        <Button title="Stop Sensor" onPress={stopSensor} />
        <Button title="Calibrate" onPress={() => {
          orientationInitialized.current = false;
          data.current = 'index,time,acc x,acc y,acc z,ori x,ori y,ori z\n';
        }} />
        <Button title="Share Data" onPress={() => {
          Share.share({
            message: data.current,
            title: 'Sensor Data',
          });
        }} />
        <Button title="Clear Data" onPress={() => {
          data.current = 'index,time,acc x,acc y,acc z,sin ori x,sin ori y,sin ori z,user input\n';
        }} />
        {/* 무음모드 꺼라 ㅡㅡ */}
        <Button title="Vibrate" onPress={() => {
          Vibration.vibrate();
        }} />
      </View>
    );
}

export default App;
