import React, { useState } from 'react';
import { SPOTS, DEFAULT_BOOKINGS, getAvailableSpots } from './data';
import { useLocalStorage } from './useLocalStorage';
import SpotCard from './SpotCard';
import BookingModal from './BookingModal';
import BookingHistory from './BookingHistory';
import CalendarView from './CalendarView';
import styles from './App.module.css';

export default function App() {
  const [bookings, setBookings] = useLocalStorage('post-parking-bookings-v3', DEFAULT_BOOKINGS);
  const [view, setView] = useState('cards');
  const [toast, setToast] = useState(null);
  const [animatingId, setAnimatingId] = useState(null);

  const [bookingModal, setBookingModal] = useState(null);
  const [historySpot, setHistorySpot] = useState(null);

  const [searchIn, setSearchIn] = useState('');
  const [searchOut, setSearchOut] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const triggerPulse = (id) => { setAnimatingId(id); setTimeout(() => setAnimatingId(null), 600); };

  const handleSaveBooking = (entry, isEdit) => {
    if (isEdit) {
      setBookings((prev) => prev.map((b) => (b.id === entry.id ? entry : b)));
      showToast(`Booking updated for ${entry.guest}`);
    } else {
      setBookings((prev) => [...prev, entry]);
      showToast(`${entry.spotId} booked for ${entry.guest}`);
    }
    triggerPulse(entry.spotId);
    setBookingModal(null);
  };

  const handleCancelBooking = (bookingId) => {
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b)));
    showToast('Booking cancelled');
  };

  const handleStatusChange = (bookingId, newStatus) => {
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b)));
    showToast(newStatus === 'active' ? 'Guest checked in' : 'Booking completed');
  };

  const handleReset = () => { setBookings(DEFAULT_BOOKINGS); showToast('All bookings cleared'); };

  const isSearching = searchIn && searchOut && searchIn < searchOut;
  const availableSpotIds = isSearching
    ? new Set(getAvailableSpots(SPOTS, bookings, searchIn, searchOut).map((s) => s.id))
    : null;

  const occupiedNow = SPOTS.filter((spot) =>
    bookings.some((b) => b.spotId === spot.id && b.status === 'active' && b.checkIn <= today && b.checkOut > today)
  ).length;
  const reservedFuture = bookings.filter((b) => b.status === 'reserved' && b.checkIn > today).length;
  const activeBookings = bookings.filter((b) => b.status === 'active' || b.status === 'reserved');

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <div className={styles.headerTop}>
            <span className={styles.logo}>P</span>
            <h1 className={styles.title}>POST Parking</h1>
          </div>
          <p className={styles.subtitle}>
            Pool-based spot management · Spots are limited &amp; subject to availability
          </p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.viewTabs}>
            {[
              { key: 'cards', label: '⊞ Cards' },
              { key: 'list', label: '☰ List' },
              { key: 'calendar', label: '📅 Calendar' },
            ].map((v) => (
              <button
                key={v.key}
                className={`${styles.viewTab} ${view === v.key ? styles.viewTabActive : ''}`}
                onClick={() => setView(v.key)}
              >{v.label}</button>
            ))}
          </div>
          <button className={styles.resetBtn} onClick={handleReset}>Clear All</button>
        </div>
      </header>

      {/* Availability Search */}
      {view !== 'calendar' && (
        <div className={`${styles.searchSection} ${isSearching ? styles.searchActive : ''}`}>
          <div className={styles.searchHeader}>
            <span className={styles.searchTitle}>
              <span className={styles.searchIcon}>🔍</span>
              Check Availability
            </span>
            {isSearching && (
              <button className={styles.clearBtn} onClick={() => { setSearchIn(''); setSearchOut(''); }}>
                Clear search
              </button>
            )}
          </div>
          <div className={styles.searchRow}>
            <div className={styles.searchField}>
              <label className={styles.searchLabel}>Check-in</label>
              <input type="date" className={styles.searchInput} value={searchIn} onChange={(e) => setSearchIn(e.target.value)} />
            </div>
            <div className={styles.searchField}>
              <label className={styles.searchLabel}>Check-out</label>
              <input type="date" className={styles.searchInput} value={searchOut} onChange={(e) => setSearchOut(e.target.value)} />
            </div>
          </div>
          {isSearching && (
            <div className={`${styles.searchResult} ${availableSpotIds.size > 0 ? styles.searchAvailable : styles.searchNone}`}>
              {availableSpotIds.size > 0
                ? `${availableSpotIds.size} of ${SPOTS.length} spots available for ${searchIn} → ${searchOut}`
                : `No spots available for ${searchIn} → ${searchOut} — all booked`}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className={styles.statsBar}>
        {[
          { label: 'Total Spots', value: SPOTS.length, color: '#546E7A' },
          { label: 'Occupied Now', value: occupiedNow, color: 'var(--red)' },
          { label: 'Future Res.', value: reservedFuture, color: 'var(--orange)' },
          { label: 'Active Bookings', value: activeBookings.length, color: 'var(--navy)' },
        ].map((s, i) => (
          <div key={i} className={styles.statCard} style={{ animationDelay: `${i * 80}ms` }}>
            <div className={styles.statValue} style={{ color: s.color }}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Calendar View */}
      {view === 'calendar' && (
        <CalendarView
          bookings={bookings}
          onClickSpot={(spot) => setBookingModal({ spot, booking: null })}
        />
      )}

      {/* Card / List View */}
      {view !== 'calendar' && (
        <div className={view === 'cards' ? styles.grid : styles.list}>
          {SPOTS.map((spot) => (
            <SpotCard
              key={spot.id}
              spot={spot}
              bookings={bookings}
              today={today}
              isAnimating={animatingId === spot.id}
              availableForSearch={isSearching ? availableSpotIds.has(spot.id) : null}
              onBook={(s) => setBookingModal({ spot: s, booking: null })}
              onViewBookings={(s) => setHistorySpot(s)}
            />
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {bookingModal && (
        <BookingModal
          spot={bookingModal.spot}
          booking={bookingModal.booking}
          bookings={bookings}
          onSave={handleSaveBooking}
          onClose={() => setBookingModal(null)}
        />
      )}

      {/* Booking History */}
      {historySpot && (
        <BookingHistory
          spot={historySpot}
          bookings={bookings}
          onEdit={(b) => { setHistorySpot(null); setBookingModal({ spot: historySpot, booking: b }); }}
          onCancel={handleCancelBooking}
          onComplete={handleStatusChange}
          onClose={() => setHistorySpot(null)}
        />
      )}

      {/* Toast */}
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
