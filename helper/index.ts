export function calculateQiblaAngle(latitude: number, longitude: number) {
  const kaabaLat = 21.4225;
  const kaabaLng = 39.8262;

  const userLatRad = (Math.PI / 180) * latitude;
  const userLngRad = (Math.PI / 180) * longitude;
  const kaabaLatRad = (Math.PI / 180) * kaabaLat;
  const kaabaLngRad = (Math.PI / 180) * kaabaLng;

  const deltaLng = kaabaLngRad - userLngRad;

  const y = Math.sin(deltaLng);
  const x =
    Math.cos(userLatRad) * Math.tan(kaabaLatRad) -
    Math.sin(userLatRad) * Math.cos(deltaLng);

  let angle = Math.atan2(y, x) * (180 / Math.PI);
  angle = (angle + 360) % 360; // Normalize
  return angle;
}
