import React, { useState, useEffect, useCallback } from 'react';
import { SPOTS, DEFAULT_BOOKINGS, getAvailableSpots } from './data';
import { supabase } from './supabase';
import SpotCard from './SpotCard';
import BookingModal from './BookingModal';
import BookingHistory from './BookingHistory';
import CalendarView from './CalendarView';
import styles from './App.module.css';

export default function App() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // Load bookings from Supabase
  const fetchBookings = useCallback(async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('check_in', { ascending: true });

    if (error) {
      console.error('Error fetching bookings:', error);
      showToast('Error loading bookings');
      return;
    }

    // Map database columns to app format
    const mapped = (data || []).map((row) => ({
      id: row.id,
      spotId: row.spot_id,
      guest: row.guest,
      unit: row.unit || '',
      vehicle: row.vehicle || '',
      checkIn: row.check_in,
      checkOut: row.check_out,
      notes: row.notes || '',
      status: row.status,
    }));

    setBookings(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBookings();

    // Real-time subscription — all changes sync instantly
    const channel = supabase
      .channel('bookings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchBookings();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchBookings]);

  // Save booking
  const handleSaveBooking = async (entry, isEdit) => {
    const row = {
      id: entry.id,
      spot_id: entry.spotId,
      guest: entry.guest,
      unit: entry.unit || null,
      vehicle: entry.vehicle || null,
      check_in: entry.checkIn,
      check_out: entry.checkOut,
      notes: entry.notes || null,
      status: entry.status,
    };

    if (isEdit) {
      const { error } = await supabase.from('bookings').update(row).eq('id', entry.id);
      if (error) { showToast('Error updating booking'); return; }
      showToast(`Booking updated for ${entry.guest}`);
    } else {
      const { error } = await supabase.from('bookings').insert(row);
      if (error) { showToast('Error creating booking'); return; }
      showToast(`${entry.spotId} booked for ${entry.guest}`);
    }

    triggerPulse(entry.spotId);
    setBookingModal(null);
    fetchBookings();
  };

  // Cancel booking
  const handleCancelBooking = async (bookingId) => {
    const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
    if (error) { showToast('Error cancelling booking'); return; }
    showToast('Booking cancelled');
    fetchBookings();
  };

  // Change status (check in / complete)
  const handleStatusChange = async (bookingId, newStatus) => {
    const { error } = await supabase.from('bookings').update({ status: newStatus }).eq('id', bookingId);
    if (error) { showToast('Error updating status'); return; }
    showToast(newStatus === 'active' ? 'Guest checked in' : 'Booking completed');
    fetchBookings();
  };

  // Clear all
  const handleReset = async () => {
    const { error } = await supabase.from('bookings').delete().neq('id', '');
    if (error) { showToast('Error clearing bookings'); return; }
    showToast('All bookings cleared');
    fetchBookings();
  };

  {isSearching && (
    <>
      <div className={`${styles.searchResult} ${availableSpotIds.size > 0 ? styles.searchAvailable : styles.searchNone}`}>
        {availableSpotIds.size > 0
          ? SPOTS.filter(s => availableSpotIds.has(s.id)).map(s => s.id).join(', ')
          : `No spots available for ${searchIn} → ${searchOut} — all booked`}
      </div>
      {availableSpotIds.size > 0 && (
        <div className={`${styles.searchResult} ${styles.searchAvailable}`} style={{ marginTop: 8 }}>
          {`${availableSpotIds.size} of ${SPOTS.length} spots available for ${searchIn} → ${searchOut}`}
        </div>
      )}
    </>
  )}

  const occupiedNow = SPOTS.filter((spot) =>
    bookings.some((b) => b.spotId === spot.id && b.status === 'active' && b.checkIn <= today && b.checkOut > today)
  ).length;
  const reservedFuture = bookings.filter((b) => b.status === 'reserved' && b.checkIn > today).length;
  const activeBookings = bookings.filter((b) => b.status === 'active' || b.status === 'reserved');

  if (loading) {
    return (
      <div className={styles.wrapper} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🅿️</div>
          <div style={{ color: '#78909C', fontSize: 15, fontWeight: 500 }}>Loading parking data...</div>
        </div>
      </div>
    );
  }

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
            <div className={`${styles.searchResult} ${availableSpotIds.size > 0 ? styles.searchAvailable : styles.searchNone}`}>
              {availableSpotIds.size > 0
                ? `${availableSpotIds.size} of ${SPOTS.length} spots available for ${searchIn} → ${searchOut}: ${SPOTS.filter(s => availableSpotIds.has(s.id)).map(s => s.id).join(', ')}`
                : `No spots available for ${searchIn} → ${searchOut} — all booked`}
            </div>
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