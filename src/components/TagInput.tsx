import { useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";

interface TagInputProps {
  value: string[];
  onChange(tags: string[]): void;
  allTags: string[];
  placeholder?: string;
  restrictToExisting?: boolean;
  showAllWhenFocused?: boolean;
}

export function TagInput({
  value,
  onChange,
  allTags,
  placeholder = "Add tag…",
  restrictToExisting = false,
  showAllWhenFocused = false,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = showAllWhenFocused
    ? allTags.filter(
        (t) =>
          !value.includes(t) &&
          (inputValue.trim() === "" || t.toLowerCase().includes(inputValue.toLowerCase())),
      )
    : inputValue.trim()
      ? allTags.filter(
          (t) =>
            t.toLowerCase().includes(inputValue.toLowerCase()) &&
            !value.includes(t),
        )
      : [];

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase();
    if (!tag || /\s/.test(tag) || value.includes(tag)) return;
    if (restrictToExisting && !allTags.includes(tag)) return;
    onChange([...value, tag]);
    setInputValue("");
    setOpen(false);
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "Tab" || e.key === "," || e.key === " ") {
      const current = inputValue.trim();
      if (current) {
        e.preventDefault();
        addTag(current);
      }
    } else if ((e.key === "Backspace" || e.key === "Delete") && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setInputValue("");
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setInputValue(val);
    setOpen(showAllWhenFocused ? true : val.trim().length > 0);
  }

  function handleFocus() {
    if (showAllWhenFocused && allTags.some((t) => !value.includes(t))) {
      setOpen(true);
    }
  }

  return (
    <Popover.Root open={open && suggestions.length > 0} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <div
          className="flex min-h-[38px] flex-wrap items-center gap-1 rounded-md border border-edge bg-surface-2 px-2 py-1.5 focus-within:border-accent"
          onClick={() => inputRef.current?.focus()}
        >
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded bg-accent/20 px-2 py-0.5 text-xs text-accent"
            >
              {tag}
              <button
                type="button"
                aria-label={`Remove tag ${tag}`}
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                className="leading-none opacity-70 hover:opacity-100"
              >
                ×
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={() => {
              if (inputValue.trim()) addTag(inputValue);
              setTimeout(() => setOpen(false), 150);
            }}
            placeholder={value.length === 0 ? placeholder : ""}
            className="min-w-[80px] flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-muted"
          />
        </div>
      </Popover.Anchor>

      <Popover.Portal>
        <Popover.Content
          onOpenAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onFocusOutside={(e) => e.preventDefault()}
          side="bottom"
          align="start"
          sideOffset={4}
          className="z-50 w-[var(--radix-popover-trigger-width)] overflow-y-auto rounded-md border border-edge bg-surface shadow-lg max-h-60"
        >
          {suggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addTag(tag);
              }}
              className="block w-full px-3 py-2 text-left text-sm text-fg hover:bg-surface-2"
            >
              {tag}
            </button>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
