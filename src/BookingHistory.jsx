import React from 'react';
import { BOOKING_STATUS, getSpotBookings } from './data';
import styles from './BookingHistory.module.css';

export default function BookingHistory({ spot, bookings, onEdit, onCancel, onComplete, onClose }) {
  const spotBookings = getSpotBookings(bookings, spot.id);
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{spot.id} — Booking History</h2>
            <p className={styles.subtitle}>{spotBookings.length} booking{spotBookings.length !== 1 ? 's' : ''}</p>
          </div>
          <button className={styles.close} onClick={onClose}>×</button>
        </div>
        <div className={styles.body}>
          {spotBookings.length === 0 && <p className={styles.empty}>No bookings yet.</p>}
          {spotBookings.map((b) => {
            const st = BOOKING_STATUS[b.status] || BOOKING_STATUS.reserved;
            const isPast = b.checkOut <= today && b.status !== 'completed';
            return (
              <div key={b.id} className={styles.bookingCard}>
                <div className={styles.bookingHeader}>
                  <div>
                    <span className={styles.guest}>{b.guest}</span>
                    {b.unit && <span className={styles.unit}>Unit {b.unit}</span>}
                  </div>
                  <span className={styles.statusBadge} style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span>
                </div>
                <div className={styles.dates}>{b.checkIn} → {b.checkOut}</div>
                {b.vehicle && <div className={styles.meta}>Vehicle: {b.vehicle}</div>}
                {b.notes && <div className={styles.meta}>Notes: {b.notes}</div>}
                {isPast && b.status === 'active' && <div className={styles.pastWarning}>⚠ Check-out date has passed</div>}
                <div className={styles.bookingActions}>
                  {(b.status === 'reserved' || b.status === 'active') && (
                    <>
                      <button className={styles.editBtn} onClick={() => onEdit(b)}>Edit</button>
                      {b.status === 'reserved' && <button className={styles.activateBtn} onClick={() => onComplete(b.id, 'active')}>Check In</button>}
                      {b.status === 'active' && <button className={styles.completeBtn} onClick={() => onComplete(b.id, 'completed')}>Complete</button>}
                      <button className={styles.cancelBtn} onClick={() => onCancel(b.id)}>Cancel</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
