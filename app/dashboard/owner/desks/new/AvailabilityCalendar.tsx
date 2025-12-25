"use client";

import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { addDays, addMonths, isSameDay, format } from 'date-fns';
import 'react-day-picker/style.css';

type Props = {
  selectedDates: Date[];
  onChange: (dates: Date[]) => void;
};

export default function AvailabilityCalendar({ selectedDates, onChange }: Props) {
  const [rangeMode, setRangeMode] = useState(false);
  const [rangeStart, setRangeStart] = useState<Date | null>(null);

  // Normalize date to midnight UTC to avoid timezone issues
  const normalizeDate = (date: Date): Date => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  };

  const handleDayClick = (day: Date) => {
    const normalizedDay = normalizeDate(day);

    if (rangeMode) {
      // Range selection mode
      if (!rangeStart) {
        setRangeStart(normalizedDay);
      } else {
        const normalizedStart = normalizeDate(rangeStart);
        // Complete the range
        const start = normalizedStart < normalizedDay ? normalizedStart : normalizedDay;
        const end = normalizedStart < normalizedDay ? normalizedDay : normalizedStart;
        const daysInRange: Date[] = [];
        let current = new Date(start);
        while (current <= end) {
          daysInRange.push(new Date(current));
          current = addDays(current, 1);
        }

        // Add all days in range to selected dates (avoid duplicates)
        const newDates = [...selectedDates];
        daysInRange.forEach(d => {
          if (!newDates.some(existing => isSameDay(existing, d))) {
            newDates.push(d);
          }
        });
        onChange(newDates);
        setRangeStart(null);
      }
    } else {
      // Single day selection mode
      const isSelected = selectedDates.some(d => isSameDay(d, normalizedDay));
      if (isSelected) {
        onChange(selectedDates.filter(d => !isSameDay(d, normalizedDay)));
      } else {
        onChange([...selectedDates, normalizedDay]);
      }
    }
  };

  const clearAllDates = () => {
    onChange([]);
    setRangeStart(null);
  };

  // Convert UTC dates to local timezone dates for DayPicker to recognize them
  const localSelectedDates = selectedDates.map(d => {
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    const day = d.getUTCDate();
    return new Date(year, month, day);
  });

  const localRangeStart = rangeStart ? (() => {
    const year = rangeStart.getUTCFullYear();
    const month = rangeStart.getUTCMonth();
    const day = rangeStart.getUTCDate();
    return new Date(year, month, day);
  })() : null;

  const modifiers = {
    selected: localSelectedDates,
    rangeStart: localRangeStart ? [localRangeStart] : [],
  };

  const modifiersStyles = {
    selected: {
      backgroundColor: '#3b82f6',
      color: 'white',
      fontWeight: 'bold',
    },
    rangeStart: {
      backgroundColor: '#1d4ed8',
      color: 'white',
      fontWeight: 'bold',
      border: '2px solid #60a5fa',
    },
  };

  // Generate array of 12 months starting from current month (full year ahead)
  const months = Array.from({ length: 12 }, (_, i) => addMonths(new Date(), i));

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 space-y-3 sticky top-0 bg-white z-10 pb-4">
        <h3 className="text-sm font-semibold text-gray-900">Available dates</h3>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={rangeMode}
              onChange={(e) => {
                setRangeMode(e.target.checked);
                setRangeStart(null);
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Range selection mode
          </label>
          <button
            type="button"
            onClick={clearAllDates}
            className="text-sm text-gray-500 hover:text-gray-900 hover:underline text-left transition"
          >
            Clear all dates
          </button>
          {selectedDates.length > 0 && (
            <div className="text-sm font-medium text-gray-600">
              {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>

        {rangeMode && rangeStart && (
          <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            Range start: {format(rangeStart, 'MMM d, yyyy')} - Click another date to complete range
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {months.map((month, idx) => (
          <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-white">
            <DayPicker
              onDayClick={handleDayClick}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              disabled={{ before: new Date() }}
              month={month}
              numberOfMonths={1}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
