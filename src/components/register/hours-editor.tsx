'use client';

import type { ReactNode } from 'react';

import { WEEKDAY_NAMES, WEEKDAYS_MONDAY_FIRST } from '@/lib/format';
import { emptyWeeklyHours } from './wizard-state';
import { Button, Card, Select } from '@/components/ui';
import type { DayHours, Weekday, WeeklyHours } from '@/types/domain';

export type HoursEditorProps = {
  hours: WeeklyHours;
  onChange: (hours: WeeklyHours) => void;
  /**
   * One optional message per weekday, computed by the page from the shared
   * weeklyHoursSchema — the editor is presentational about validation.
   */
  dayErrors?: Partial<Record<Weekday, string>>;
};

// 15-minute grid (§5). Fixed 06:00–23:45 range: no salon books outside it in
// this MVP and selects keep the "HH:mm" format error unreachable in the UI.
const TIMES: string[] = [];
for (let hour = 6; hour <= 23; hour += 1) {
  for (const minute of [0, 15, 30, 45]) {
    TIMES.push(
      `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    );
  }
}

/** Hours used when a day flips from "Cerrado" to open. */
const DEFAULT_OPEN = '10:00';
const DEFAULT_CLOSE = '18:00';

interface HourPreset {
  label: string;
  days: Weekday[];
  open: string;
  close: string;
}

const PRESETS: readonly HourPreset[] = [
  {
    label: 'Mar-Sáb 10:00-19:00',
    days: [2, 3, 4, 5, 6],
    open: '10:00',
    close: '19:00',
  },
  {
    label: 'Lun-Vie 09:00-18:00',
    days: [1, 2, 3, 4, 5],
    open: '09:00',
    close: '18:00',
  },
  {
    label: 'Todos los días 10:00-20:00',
    days: [0, 1, 2, 3, 4, 5, 6],
    open: '10:00',
    close: '20:00',
  },
];

function presetHours(preset: HourPreset): WeeklyHours {
  const hours = emptyWeeklyHours();
  for (const day of preset.days) {
    hours[day] = { open: preset.open, close: preset.close };
  }
  return hours;
}

/** Copy of `hours` with one day replaced — WeeklyHours is never mutated. */
function withDay(
  hours: WeeklyHours,
  day: Weekday,
  next: DayHours,
): WeeklyHours {
  const copy = { ...hours };
  copy[day] = next;
  return copy;
}

export function HoursEditor({
  hours,
  onChange,
  dayErrors = {},
}: HoursEditorProps): ReactNode {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-taupe">Presets:</span>
        {PRESETS.map((preset) => (
          <Button
            key={preset.label}
            variant="secondary"
            size="sm"
            className="text-xs"
            onClick={() => onChange(presetHours(preset))}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      {WEEKDAYS_MONDAY_FIRST.map((day) => {
        const dayHours = hours[day];
        const open = dayHours !== null;
        const error = dayErrors[day];
        return (
          <Card key={day} className="p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-espresso">
                {WEEKDAY_NAMES[day]}
              </span>
              {/* The row itself is the open/closed switch; label doubles as
                  state so color alone never carries the meaning (§13). */}
              <Button
                variant={open ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() =>
                  onChange(
                    withDay(
                      hours,
                      day,
                      open
                        ? null
                        : { open: DEFAULT_OPEN, close: DEFAULT_CLOSE },
                    ),
                  )
                }
              >
                {open ? 'Abierto' : 'Cerrado'}
              </Button>
            </div>
            {open && dayHours !== null && (
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor={`hours-open-${day}`}
                    className="text-xs text-taupe"
                  >
                    Abre
                  </label>
                  <Select
                    id={`hours-open-${day}`}
                    value={dayHours.open}
                    onChange={(event) =>
                      onChange(
                        withDay(hours, day, {
                          ...dayHours,
                          open: event.target.value,
                        }),
                      )
                    }
                    aria-invalid={error !== undefined ? true : undefined}
                    aria-describedby={
                      error !== undefined ? `hours-error-${day}` : undefined
                    }
                  >
                    {TIMES.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor={`hours-close-${day}`}
                    className="text-xs text-taupe"
                  >
                    Cierra
                  </label>
                  <Select
                    id={`hours-close-${day}`}
                    value={dayHours.close}
                    onChange={(event) =>
                      onChange(
                        withDay(hours, day, {
                          ...dayHours,
                          close: event.target.value,
                        }),
                      )
                    }
                    aria-invalid={error !== undefined ? true : undefined}
                    aria-describedby={
                      error !== undefined ? `hours-error-${day}` : undefined
                    }
                  >
                    {TIMES.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            )}
            {error !== undefined && (
              <p
                id={`hours-error-${day}`}
                className="mt-2 text-xs text-danger"
                role="alert"
              >
                {error}
              </p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
