import * as Popover from "@radix-ui/react-popover";

interface MultiSelectDropdownProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
}: MultiSelectDropdownProps) {
  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  const triggerLabel = selected.length > 0 ? `${label} · ${selected.length}` : label;

  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={`Filter by ${label}`}
        className={`flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ${
          selected.length > 0
            ? "border-accent bg-accent/10 text-accent"
            : "border-edge bg-surface-2 text-fg hover:border-accent/50"
        }`}
      >
        {triggerLabel}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
          className="opacity-60"
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={4}
          className="z-50 min-w-[140px] rounded-md border border-edge bg-surface shadow-lg"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {options.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted">No options</p>
          ) : (
            <ul role="listbox" aria-multiselectable="true" aria-label={label}>
              {options.map((opt) => (
                <li key={opt}>
                  <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-fg hover:bg-surface-2">
                    <input
                      type="checkbox"
                      checked={selected.includes(opt)}
                      onChange={() => toggle(opt)}
                      className="accent-accent"
                    />
                    {opt}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
