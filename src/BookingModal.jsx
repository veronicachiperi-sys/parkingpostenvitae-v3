import React, { useState, useEffect } from 'react';
import { getConflicts, generateId } from './data';
import styles from './BookingModal.module.css';

export default function BookingModal({ spot, booking, bookings, onSave, onClose }) {
  const isEdit = !!booking;
  const [form, setForm] = useState({
    guest: '', unit: '', vehicle: '', checkIn: '', checkOut: '', notes: '', status: 'reserved',
  });
  const [conflict, setConflict] = useState(null);

  useEffect(() => {
    if (booking) {
      setForm({
        guest: booking.guest || '', unit: booking.unit || '', vehicle: booking.vehicle || '',
        checkIn: booking.checkIn || '', checkOut: booking.checkOut || '',
        notes: booking.notes || '', status: booking.status || 'reserved',
      });
    }
  }, [booking]);

  const update = (field, value) => {
    const next = { ...form, [field]: value };
    setForm(next);
    if ((field === 'checkIn' || field === 'checkOut') && next.checkIn && next.checkOut) {
      const c = getConflicts(bookings, spot.id, next.checkIn, next.checkOut, booking?.id || null);
      setConflict(c.length > 0 ? c : null);
    }
  };

  const handleSave = () => {
    onSave({ id: booking?.id || generateId(), spotId: spot.id, ...form }, isEdit);
  };

  const isValid = form.guest.trim() && form.checkIn && form.checkOut && form.checkIn < form.checkOut && !conflict;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{isEdit ? 'Edit Booking' : 'New Booking'} — {spot.id}</h2>
          </div>
          <button className={styles.close} onClick={onClose}>×</button>
        </div>
        <div className={styles.body}>
          {conflict && (
            <div className={styles.conflictWarning}>
              ⚠ Dates conflict with {conflict.length} existing booking{conflict.length > 1 ? 's' : ''}:
              {conflict.map((c) => (
                <span key={c.id} className={styles.conflictDetail}>
                  {c.guest} ({c.checkIn} → {c.checkOut})
                </span>
              ))}
            </div>
          )}
          <div className={styles.dateRow}>
            <div className={styles.field}>
              <label className={styles.label}>Check-in *</label>
              <input className={styles.input} type="date" value={form.checkIn} onChange={(e) => update('checkIn', e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Check-out *</label>
              <input className={styles.input} type="date" value={form.checkOut} onChange={(e) => update('checkOut', e.target.value)} />
            </div>
          </div>
          {form.checkIn && form.checkOut && form.checkIn >= form.checkOut && (
            <div className={styles.dateError}>Check-out must be after check-in</div>
          )}
          <div className={styles.field}>
            <label className={styles.label}>Guest Name *</label>
            <input className={styles.input} type="text" placeholder="e.g. John Smith" value={form.guest} onChange={(e) => update('guest', e.target.value)} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Unit</label>
            <input className={styles.input} type="text" placeholder="e.g. 4B" value={form.unit} onChange={(e) => update('unit', e.target.value)} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Vehicle Info</label>
            <input className={styles.input} type="text" placeholder="e.g. White Toyota RAV4" value={form.vehicle} onChange={(e) => update('vehicle', e.target.value)} />
          </div>
          {isEdit && (
            <div className={styles.field}>
              <label className={styles.label}>Status</label>
              <select className={styles.select} value={form.status} onChange={(e) => update('status', e.target.value)}>
                <option value="reserved">Reserved</option>
                <option value="active">Active (Checked In)</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}
          <div className={styles.field}>
            <label className={styles.label}>Notes</label>
            <textarea className={styles.textarea} placeholder="Any additional notes..." value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={3} />
          </div>
        </div>
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={!isValid}>{isEdit ? 'Update' : 'Book Spot'}</button>
        </div>
      </div>
    </div>
  );
}
