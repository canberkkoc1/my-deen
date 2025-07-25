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

/**
 * Convert 24-hour time format to 12-hour format with AM/PM
 * @param time24 - Time in 24-hour format (e.g., "13:30")
 * @returns Time in 12-hour format (e.g., "1:30 PM")
 */
export function convertTo12HourFormat(time24: string): string {
  try {
    const [hours, minutes] = time24.split(":").map(Number);

    if (
      isNaN(hours) ||
      isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return time24; // Return original if invalid
    }

    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

    return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
  } catch (error) {
    console.error("Error converting time format:", error);
    return time24; // Return original if conversion fails
  }
}

/**
 * Format time based on user preference
 * @param time24 - Time in 24-hour format (e.g., "13:30")
 * @param use24Hour - Whether to use 24-hour format
 * @returns Formatted time string
 */
export function formatTime(time24: string, use24Hour: boolean): string {
  return use24Hour ? time24 : convertTo12HourFormat(time24);
}
