export const SPOTS = [
  { id: "Spot 1", type: "Garage" },
  { id: "Spot 10", type: "Garage" },
  { id: "Spot 16", type: "Garage" },
  { id: "Spot 17", type: "Garage" },
  { id: "Spot 22", type: "Lot" },
  { id: "Spot 33", type: "Lot" },
  { id: "Spot 34", type: "Lot" },
  { id: "Spot 36", type: "Lot" },
  { id: "Spot 39", type: "Lot" },
  { id: "Spot 40", type: "Lot" },
];

export const DEFAULT_BOOKINGS = [];

export const BOOKING_STATUS = {
  reserved:  { label: "Reserved",  color: "#FF9800", bg: "#FFF3E0" },
  active:    { label: "Active",    color: "#4CAF50", bg: "#E8F5E9" },
  completed: { label: "Completed", color: "#78909C", bg: "#ECEFF1" },
  cancelled: { label: "Cancelled", color: "#E53935", bg: "#FFEBEE" },
};

export function datesOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

export function getConflicts(bookings, spotId, checkIn, checkOut, excludeBookingId = null) {
  return bookings.filter(
    (b) =>
      b.spotId === spotId &&
      b.id !== excludeBookingId &&
      (b.status === "reserved" || b.status === "active") &&
      datesOverlap(checkIn, checkOut, b.checkIn, b.checkOut)
  );
}

export function getAvailableSpots(spots, bookings, checkIn, checkOut) {
  return spots.filter((spot) => getConflicts(bookings, spot.id, checkIn, checkOut).length === 0);
}

export function getCurrentBooking(bookings, spotId, today) {
  const live = bookings.filter(
    (b) => b.spotId === spotId && (b.status === "active" || b.status === "reserved")
  );
  const current = live.find((b) => b.checkIn <= today && b.checkOut > today);
  if (current) return current;
  const upcoming = live.filter((b) => b.checkIn > today).sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  return upcoming[0] || null;
}

export function getSpotBookings(bookings, spotId) {
  return bookings
    .filter((b) => b.spotId === spotId && b.status !== "cancelled")
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
}

export function generateId() {
  return "bk-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** Get array of date strings between start and end (exclusive of end) */
export function getDateRange(start, end) {
  const dates = [];
  const d = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  while (d < e) {
    dates.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

/** Format YYYY-MM-DD to short display like "Apr 23" */
export function formatDateShort(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
