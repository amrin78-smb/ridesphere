/**
 * Formats a ride's start in the ride's own time zone, because "06:00" must mean 06:00 where
 * the ride happens, whatever the phone is set to. Example: "Sat 12 Oct, 06:00 GMT+7".
 */
export function formatRideStart(isoUtc: string, timeZone: string): string {
  const date = new Date(isoUtc);
  try {
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone,
      timeZoneName: 'short',
    }).format(date);
  } catch {
    // Unknown zone on this device: fall back to an unambiguous UTC time.
    return `${isoUtc.slice(0, 10)} ${isoUtc.slice(11, 16)} UTC`;
  }
}

export function formatDistance(km: number): string {
  return `${Number.isInteger(km) ? km : km.toFixed(1)} km`;
}

export function formatElevation(metres: number | null): string | null {
  return metres === null ? null : `${metres.toLocaleString('en-GB')} m climbing`;
}
