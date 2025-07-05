import {Vector3D, defaultVector} from './vector';

type CalibrationResult = {
  acceleration: Vector3D;
  orientation: Vector3D;
};

const initializeOrientaion = (acceleration: Vector3D): Vector3D => {
  acceleration = acceleration.normalize();
  return new Vector3D(
    -Math.PI - Math.atan2(acceleration.z, acceleration.y),
    0,
    Math.asin(acceleration.x),
  );
};

const calculateGravity = (orientaion: Vector3D): Vector3D => {
  return new Vector3D(
    -Math.sin(orientaion.z),
    -Math.cos(orientaion.x) * Math.cos(orientaion.z),
    Math.sin(orientaion.x) * Math.cos(orientaion.z),
  );
};

const integrateGyro = (
  orientation: Vector3D,
  gyro: Vector3D,
  dt: number,
): Vector3D => {
  return new Vector3D(
    orientation.x + (gyro.x * dt) / 1000,
    0,
    orientation.z + (gyro.z * dt) / 1000,
  );
};

const radiansToDegrees = (radians: number): number => {
  return radians * (180 / Math.PI);
};

const normalizeAngle = (angle: number): number => {
  while (angle < -Math.PI) {
    angle += 2 * Math.PI;
  }
  while (angle > Math.PI) {
    angle -= 2 * Math.PI;
  }
  return angle;
};

const autoCalibrate = (
  acceleration: Vector3D,
  gyro: Vector3D,
  orientation: Vector3D,
  dt: number,
): CalibrationResult => {
  const threshold = 1.1;

  // cosine similarity should be more than 0.5(which means 60 degrees) since the error value magnifies as the angle converges to 90 degrees(x axis)
  if (
    acceleration.magnitude() < threshold &&
    acceleration.cosineSimilarity(defaultVector) > 0.5
  ) {
    let _acceleration = acceleration.normalize();
    orientation = new Vector3D(
      -Math.PI - Math.atan2(_acceleration.z, _acceleration.y),
      0,
      -Math.asin(_acceleration.x),
    );
  } else {
    orientation = integrateGyro(orientation, gyro, dt);
  }

  return {
    acceleration: acceleration.subtract(calculateGravity(orientation)),
    orientation: orientation,
  };
};

export type {Vector3D};
export {
  autoCalibrate,
  initializeOrientaion,
  calculateGravity,
  integrateGyro,
  radiansToDegrees,
};
