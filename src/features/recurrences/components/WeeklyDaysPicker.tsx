interface WeeklyDaysPickerProps {
  selectedDays: number[];
  onChange: (days: number[]) => void;
}

const DAYS: { value: number; label: string }[] = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 7, label: 'Sun' },
];

export function WeeklyDaysPicker({
  selectedDays,
  onChange,
}: WeeklyDaysPickerProps) {
  function handleToggle(day: number): void {
    const isSelected = selectedDays.includes(day);
    const next = isSelected
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];
    onChange([...next].sort((a, b) => a - b));
  }

  return (
    <div className="flex gap-1">
      {DAYS.map(({ value, label }) => {
        const isSelected = selectedDays.includes(value);
        return (
          <button
            key={value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => handleToggle(value)}
            className={`cursor-pointer rounded px-2 py-1 text-xs font-medium transition-colors ${
              isSelected
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
