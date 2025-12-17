"use client";

import { useState } from "react";

type Props = {
  availableDates: Date[];
};

export default function AvailabilityCalendarReadOnly({ availableDates }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          className="px-2 py-1 text-sm rounded hover:bg-muted"
        >
          ←
        </button>
        <div className="text-sm font-semibold">
          {monthNames[month]} {year}
        </div>
        <button
          type="button"
          onClick={nextMonth}
          className="px-2 py-1 text-sm rounded hover:bg-muted"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs text-center mb-1">
        <div className="font-medium text-foreground/60">S</div>
        <div className="font-medium text-foreground/60">M</div>
        <div className="font-medium text-foreground/60">T</div>
        <div className="font-medium text-foreground/60">W</div>
        <div className="font-medium text-foreground/60">T</div>
        <div className="font-medium text-foreground/60">F</div>
        <div className="font-medium text-foreground/60">S</div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs">
        {weeks.flat().map((day, idx) => {
          if (day === null) {
            return <div key={idx} className="aspect-square" />;
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isAvailable = availableDateStrings.has(dateStr);

          return (
            <div
              key={idx}
              className={`
                aspect-square flex items-center justify-center rounded
                ${isAvailable
                  ? 'bg-green-100 text-green-800 font-medium'
                  : 'text-foreground/40'
                }
              `}
            >
              {day}
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-foreground/60">
        <span className="inline-block w-3 h-3 bg-green-100 rounded mr-1"></span>
        Available dates
      </div>
    </div>
  );
}
