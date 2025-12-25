"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  deskId: string;
  pricePerDay: number;
  currency: string;
  availableDates: Date[];
  isOwnDesk?: boolean;
};

export default function BookingCard({ deskId, pricePerDay, currency, availableDates, isOwnDesk = false }: Props) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableDateStrings = new Set(
    availableDates.map((d) => d.toISOString().split('T')[0])
  );

  function generateCalendar(year: number, month: number) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const weeks: (number | null)[][] = [];
    let week: (number | null)[] = new Array(startingDayOfWeek).fill(null);

    for (let day = 1; day <= daysInMonth; day++) {
      week.push(day);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }

    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }

    return weeks;
  }

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const weeks = generateCalendar(year, month);

  function prevMonth() {
    setCurrentMonth(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentMonth(new Date(year, month + 1, 1));
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  function toggleDate(dateStr: string) {
    if (!availableDateStrings.has(dateStr)) return;

    setError(null);
    const newSelected = new Set(selectedDates);

    if (newSelected.has(dateStr)) {
      newSelected.delete(dateStr);
    } else {
      newSelected.add(dateStr);
    }

    setSelectedDates(newSelected);
  }

  function clearSelection() {
    setSelectedDates(new Set());
    setError(null);
  }

  // Calculate price
  const numberOfDays = selectedDates.size;
  const subtotal = (pricePerDay / 100) * numberOfDays;
  const platformFee = subtotal * 0.15;
  const total = subtotal + platformFee;

  function handleReserve() {
    // Convert selected dates to sorted array and navigate to review page
    const sortedDates = Array.from(selectedDates).sort();
    const datesParam = sortedDates.join(',');

    router.push(`/desk/${deskId}/book?dates=${datesParam}`);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
      <div className="mb-5 pb-5 border-b border-gray-200">
        <div className="text-2xl font-semibold text-gray-900">
          {pricePerDay / 100} {currency}
          <span className="text-base font-normal text-gray-600"> / day</span>
        </div>
      </div>

      <div className="mb-5">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Select dates</h3>
        <div className="w-full">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="px-2 py-1 text-sm rounded hover:bg-gray-50 text-gray-700"
            >
              ←
            </button>
            <div className="text-sm font-semibold text-gray-900">
              {monthNames[month]} {year}
            </div>
            <button
              type="button"
              onClick={nextMonth}
              className="px-2 py-1 text-sm rounded hover:bg-gray-50 text-gray-700"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-xs text-center mb-1">
            <div className="font-medium text-gray-600">S</div>
            <div className="font-medium text-gray-600">M</div>
            <div className="font-medium text-gray-600">T</div>
            <div className="font-medium text-gray-600">W</div>
            <div className="font-medium text-gray-600">T</div>
            <div className="font-medium text-gray-600">F</div>
            <div className="font-medium text-gray-600">S</div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-xs">
            {weeks.flat().map((day, idx) => {
              if (day === null) {
                return <div key={idx} className="aspect-square" />;
              }

              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isAvailable = availableDateStrings.has(dateStr);
              const isSelected = selectedDates.has(dateStr);

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => toggleDate(dateStr)}
                  className={`
                    aspect-square flex items-center justify-center rounded text-sm
                    transition-all
                    ${!isAvailable
                      ? 'text-gray-300 cursor-not-allowed'
                      : isSelected
                        ? 'bg-gray-900 text-white font-semibold'
                        : 'bg-white border border-gray-300 text-gray-900 hover:border-gray-900'
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs">
            <div className="text-gray-600">
              {selectedDates.size > 0 ? `${selectedDates.size} day${selectedDates.size > 1 ? 's' : ''} selected` : 'Click dates to select'}
            </div>
            {selectedDates.size > 0 && (
              <button
                type="button"
                onClick={clearSelection}
                className="text-rose-500 hover:text-rose-600 font-semibold"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {selectedDates.size > 0 && (
        <div className="mb-5 pb-5 border-b border-gray-200 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">
              {pricePerDay / 100} {currency} × {numberOfDays} day{numberOfDays > 1 ? 's' : ''}
            </span>
            <span className="text-gray-900 font-medium">
              {subtotal.toFixed(2)} {currency}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Service fee (15%)</span>
            <span className="text-gray-900 font-medium">
              {platformFee.toFixed(2)} {currency}
            </span>
          </div>
          <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200">
            <span className="text-gray-900">Total</span>
            <span className="text-gray-900">
              {total.toFixed(2)} {currency}
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {isOwnDesk ? (
        <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
          <p className="text-sm text-gray-700 text-center">
            This is your desk. You cannot book your own desk.
          </p>
        </div>
      ) : (
        <>
          <button
            onClick={handleReserve}
            disabled={selectedDates.size === 0}
            className="w-full rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-3 text-base font-semibold text-white shadow-sm hover:from-pink-600 hover:to-rose-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reserve
          </button>

          <p className="text-xs text-center text-gray-600 mt-3">
            You won&apos;t be charged yet
          </p>
        </>
      )}
    </div>
  );
}
