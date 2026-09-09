'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Visit } from '@/lib/types';

/**
 * Client component: lets you log a visit (with optional amount/rating/notes),
 * edit a past one, and delete one. Talks only to /api/restaurants/:id/visits
 * over fetch - no Server Actions, no direct DB access from the page.
 */
export default function VisitsPanel({
  restaurantId,
  initialVisits,
}: {
  restaurantId: number;
  initialVisits: Visit[];
}) {
  const router = useRouter();
  const [visits, setVisits] = useState(initialVisits);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [date, setDate] = useState('');
  const [amountSpent, setAmountSpent] = useState('');
  const [rating, setRating] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setEditingId(null);
    setDate('');
    setAmountSpent('');
    setRating('');
    setNotes('');
  }

  function startEdit(visit: Visit) {
    setEditingId(visit.id);
    setDate(visit.date);
    setAmountSpent(visit.amountSpent === null ? '' : String(visit.amountSpent));
    setRating(visit.rating === null ? '' : String(visit.rating));
    setNotes(visit.notes ?? '');
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const url = editingId
        ? `/api/restaurants/${restaurantId}/visits/${editingId}`
        : `/api/restaurants/${restaurantId}/visits`;

      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          amountSpent: amountSpent === '' ? null : Number(amountSpent),
          rating: rating === '' ? null : Number(rating),
          notes: notes.trim() === '' ? null : notes,
        }),
      });

      const body = await res.json();

      if (!res.ok) {
        setError(body.error ?? 'Something went wrong');
        return;
      }

      if (editingId) {
        setVisits((prev) => prev.map((v) => (v.id === editingId ? (body as Visit) : v)));
      } else {
        setVisits((prev) => [body as Visit, ...prev]);
      }
      resetForm();
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(visitId: number) {
    const res = await fetch(`/api/restaurants/${restaurantId}/visits/${visitId}`, {
      method: 'DELETE',
    });

    if (res.ok || res.status === 404) {
      setVisits((prev) => prev.filter((v) => v.id !== visitId));
      if (editingId === visitId) resetForm();
      router.refresh();
    }
  }

  return (
    <div className="mt-6">
      <h3 className="mb-2 text-base font-medium">Visits</h3>

      <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            max={new Date().toISOString().slice(0, 10)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          />
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Amount spent"
            value={amountSpent}
            onChange={(e) => setAmountSpent(e.target.value)}
            className="w-32 rounded border border-gray-300 px-2 py-1 text-sm"
          />
          <input
            type="number"
            step="0.5"
            min="0"
            max="5"
            placeholder="Rating (0-5)"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className="w-28 rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </div>
        <textarea
          placeholder="How was it? (optional review notes)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
          rows={2}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="self-start rounded bg-gray-900 px-3 py-1 text-sm text-white disabled:opacity-50"
          >
            {editingId ? 'Update visit' : 'Log visit'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="self-start rounded border border-gray-300 px-3 py-1 text-sm text-gray-700"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {visits.length === 0 ? (
        <p className="text-sm text-gray-500">No visits logged yet.</p>
      ) : (
        <ul className="space-y-2">
          {visits.map((visit) => (
            <li key={visit.id} className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium">{visit.date}</span>
                <div className="flex items-center gap-3">
                  {visit.rating !== null && (
                    <span className="text-sm text-gray-500">{visit.rating}★</span>
                  )}
                  {visit.amountSpent !== null && (
                    <span className="text-sm text-gray-500">${visit.amountSpent.toFixed(2)}</span>
                  )}
                  <button
                    onClick={() => startEdit(visit)}
                    className="text-xs text-gray-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(visit.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {visit.notes && <p className="mt-1 text-sm text-gray-700">{visit.notes}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
