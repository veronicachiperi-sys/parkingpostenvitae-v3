import React, { useState, useMemo } from 'react';
import { SPOTS, BOOKING_STATUS, datesOverlap, formatDateShort } from './data';
import styles from './CalendarView.module.css';

const COLORS = [
  '#3949AB', '#00897B', '#E65100', '#6A1B9A', '#2E7D32',
  '#C62828', '#00695C', '#AD1457', '#1565C0', '#4E342E',
  '#558B2F', '#D84315', '#283593', '#00838F', '#BF360C',
];

function getBookingColor(bookingId) {
  let hash = 0;
  for (let i = 0; i < bookingId.length; i++) hash = bookingId.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function CalendarView({ bookings, onClickSpot }) {
  const [weekOffset, setWeekOffset] = useState(0);

  const { days, startDate, endDate } = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() + weekOffset * 7);
    // Start on Monday of that week
    const dayOfWeek = base.getDay();
    const monday = new Date(base);
    monday.setDate(base.getDate() - ((dayOfWeek + 6) % 7));

    const ds = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      ds.push(d.toISOString().split('T')[0]);
    }
    return { days: ds, startDate: ds[0], endDate: ds[ds.length - 1] };
  }, [weekOffset]);

  const today = new Date().toISOString().split('T')[0];

  const activeBookings = bookings.filter(
    (b) => (b.status === 'reserved' || b.status === 'active') && datesOverlap(b.checkIn, b.checkOut, days[0], days[days.length - 1] + 'z')
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.controls}>
        <button className={styles.navBtn} onClick={() => setWeekOffset((w) => w - 1)}>← Prev</button>
        <button className={styles.todayBtn} onClick={() => setWeekOffset(0)}>Today</button>
        <button className={styles.navBtn} onClick={() => setWeekOffset((w) => w + 1)}>Next →</button>
      </div>

      <div className={styles.calendarScroll}>
        <div className={styles.calendar}>
          {/* Header row: dates */}
          <div className={styles.cornerCell}></div>
          {days.map((day) => {
            const d = new Date(day + 'T00:00:00');
            const isToday = day === today;
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            return (
              <div
                key={day}
                className={`${styles.dateCell} ${isToday ? styles.todayCol : ''} ${isWeekend ? styles.weekendCol : ''}`}
              >
                <span className={styles.dayName}>{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                <span className={styles.dayNum}>{d.getDate()}</span>
                <span className={styles.monthName}>{d.toLocaleDateString('en-US', { month: 'short' })}</span>
              </div>
            );
          })}

          {/* One row per spot */}
          {SPOTS.map((spot) => {
            const spotBookings = activeBookings.filter((b) => b.spotId === spot.id);
            return (
              <React.Fragment key={spot.id}>
                <div className={styles.spotLabel} onClick={() => onClickSpot && onClickSpot(spot)}>
                  {spot.id}
                </div>
                {days.map((day) => {
                  const isToday = day === today;
                  const d = new Date(day + 'T00:00:00');
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const booking = spotBookings.find(
                    (b) => b.checkIn <= day && b.checkOut > day
                  );

                  if (!booking) {
                    return (
                      <div
                        key={day}
                        className={`${styles.cell} ${isToday ? styles.todayCol : ''} ${isWeekend ? styles.weekendBg : ''}`}
                      />
                    );
                  }

                  const isStart = booking.checkIn === day;
                  const nextDay = new Date(d);
                  nextDay.setDate(d.getDate() + 1);
                  const nextDayStr = nextDay.toISOString().split('T')[0];
                  const isEnd = booking.checkOut === nextDayStr;
                  const color = getBookingColor(booking.id);

                  return (
                    <div
                      key={day}
                      className={`${styles.cell} ${isToday ? styles.todayCol : ''}`}
                      title={`${booking.guest} | ${booking.checkIn} → ${booking.checkOut}`}
                    >
                      <div
                        className={styles.bookingBar}
                        style={{
                          backgroundColor: color,
                          borderRadius: `${isStart ? '6px' : '0'} ${isEnd ? '6px' : '0'} ${isEnd ? '6px' : '0'} ${isStart ? '6px' : '0'}`,
                          marginLeft: isStart ? 2 : 0,
                          marginRight: isEnd ? 2 : 0,
                        }}
                      >
                        {isStart && (
                          <span className={styles.bookingLabel}>{booking.guest}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
