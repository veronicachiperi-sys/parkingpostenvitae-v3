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

    const channel = supabase
      .channel('bookings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchBookings();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchBookings]);

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

  const handleCancelBooking = async (bookingId) => {
    const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
    if (error) { showToast('Error cancelling booking'); return; }
    showToast('Booking cancelled');
    fetchBookings();
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    const { error } = await supabase.from('bookings').update({ status: newStatus }).eq('id', bookingId);
    if (error) { showToast('Error updating status'); return; }
    showToast(newStatus === 'active' ? 'Guest checked in' : 'Booking completed');
    fetchBookings();
  };

  const isSearching = searchIn && searchOut && searchIn < searchOut;
  const availableSpotIds = isSearching
    ? new Set(getAvailableSpots(SPOTS, bookings, searchIn, searchOut).map((s) => s.id))
    : null;

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
          <button className={styles.resetBtn} onClick={() => {
            const headers = ['Spot', 'Guest', 'Unit', 'Vehicle', 'Check-In', 'Check-Out', 'Status', 'Notes'];
            const rows = bookings.map(b => [b.spotId, b.guest, b.unit, b.vehicle, b.checkIn, b.checkOut, b.status, b.notes]);
            const csv = [headers, ...rows].map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `parking-bookings-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}>Export CSV</button>
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
              <input type="date" className={styles.searchInput}