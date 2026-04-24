import React from 'react';
import { getCurrentBooking, getSpotBookings } from './data';
import styles from './SpotCard.module.css';

export default function SpotCard({ spot, bookings, today, isAnimating, onBook, onViewBookings, availableForSearch }) {
  const currentBooking = getCurrentBooking(bookings, spot.id, today);
  const allBookings = getSpotBookings(bookings, spot.id);
  const futureBookings = allBookings.filter(
    (b) => b.checkOut > today && (b.status === 'reserved' || b.status === 'active')
  );

  const isOccupied = currentBooking && currentBooking.checkIn <= today && currentBooking.checkOut > today;
  const isUpcoming = currentBooking && currentBooking.checkIn > today;

  let spotStatus, spotStatusColor, spotStatusBg;
  if (availableForSearch === true) {
    spotStatus = 'Available';
    spotStatusColor = '#4CAF50';
    spotStatusBg = '#E8F5E9';
  } else if (availableForSearch === false) {
    spotStatus = 'Booked';
    spotStatusColor = '#E53935';
    spotStatusBg = '#FFEBEE';
  } else if (isOccupied) {
    spotStatus = 'Occupied';
    spotStatusColor = '#E53935';
    spotStatusBg = '#FFEBEE';
  } else if (isUpcoming) {
    spotStatus = 'Next: ' + currentBooking.checkIn;
    spotStatusColor = '#FF9800';
    spotStatusBg = '#FFF3E0';
  } else {
    spotStatus = 'Available';
    spotStatusColor = '#4CAF50';
    spotStatusBg = '#E8F5E9';
  }

  return (
    <div
      className={`${styles.card} ${isAnimating ? styles.pulse : ''}`}
      style={{ borderLeftColor: spotStatusColor }}
    >
      <div className={styles.header}>
      <div>
          <span className={styles.id}>{spot.id}</span>
          <div style={{ fontSize: 11, color: '#78909C', fontWeight: 500, marginTop: 2 }}>
            {spot.type === 'Garage' ? '🏢 Garage (Covered)' : '🅿️ Lot (Uncovered)'}
          </div>
        </div>
        <span className={styles.status} style={{ backgroundColor: spotStatusBg, color: spotStatusColor }}>
          {spotStatus}
        </span>
      </div>

      {isOccupied && currentBooking && (
        <div className={styles.details}>
          <Row label="Guest" value={currentBooking.guest} />
          {currentBooking.unit && <Row label="Unit" value={currentBooking.unit} />}
          {currentBooking.vehicle && <Row label="Vehicle" value={currentBooking.vehicle} />}
          <Row label="Check-in" value={currentBooking.checkIn} />
          <Row label="Check-out" value={currentBooking.checkOut} />
        </div>
      )}

      {!isOccupied && isUpcoming && currentBooking && (
        <div className={styles.details}>
          <Row label="Upcoming" value={currentBooking.guest} />
          <Row label="Dates" value={`${currentBooking.checkIn} → ${currentBooking.checkOut}`} />
        </div>
      )}

      {futureBookings.length > 1 && (
        <div className={styles.bookingCount}>
          {futureBookings.length} upcoming booking{futureBookings.length > 1 ? 's' : ''}
        </div>
      )}

      <div className={styles.actions}>
        <button className={styles.bookBtn} onClick={() => onBook(spot)}>Book</button>
        {allBookings.length > 0 && (
          <button className={styles.viewBtn} onClick={() => onViewBookings(spot)}>
            History ({allBookings.length})
          </button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
    </div>
  );
}
