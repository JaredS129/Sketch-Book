import type { FilterState } from "../hooks/useSketchFilter";
import { MultiSelectDropdown } from "./MultiSelectDropdown";
import { TagInput } from "./TagInput";

export interface SketchFilterBarProps {
  filter: FilterState;
  onFilterChange: React.Dispatch<React.SetStateAction<FilterState>>;
  availableTypes: string[];
  availableTags: string[];
  availableAuthors: string[];
  isFiltering: boolean;
  onClear: () => void;
}

/** Stateless filter bar — all state lives in useSketchFilter via parent. */
export function SketchFilterBar({
  filter,
  onFilterChange,
  availableTypes,
  availableTags,
  availableAuthors,
  isFiltering,
  onClear,
}: SketchFilterBarProps) {
  return (
    <div
      role="search"
      aria-label="Filter sketches"
      className="flex flex-wrap items-start gap-2"
    >
      {/* T005: Name search */}
      <label className="sr-only" htmlFor="sketch-name-search">
        Search by name
      </label>
      <input
        id="sketch-name-search"
        type="search"
        value={filter.name}
        onChange={(e) => onFilterChange((f) => ({ ...f, name: e.target.value }))}
        placeholder="Search by name…"
        aria-label="Search by name"
        className="rounded-md border border-edge bg-surface-2 px-3 py-1.5 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none"
      />

      {/* T007: Type filter */}
      <MultiSelectDropdown
        label="Type"
        options={availableTypes}
        selected={filter.types}
        onChange={(types) => onFilterChange((f) => ({ ...f, types }))}
      />

      {/* T009: Tag filter */}
      <div aria-label="Filter by tag" className="min-w-[180px]">
        <TagInput
          value={filter.tags}
          onChange={(tags) => onFilterChange((f) => ({ ...f, tags }))}
          allTags={availableTags}
          placeholder="Filter by tag…"
          restrictToExisting
          showAllWhenFocused
        />
      </div>

      {/* T010: Author filter */}
      <MultiSelectDropdown
        label="Author"
        options={availableAuthors}
        selected={filter.authors}
        onChange={(authors) => onFilterChange((f) => ({ ...f, authors }))}
      />

      {/* T011: Clear button */}
      <button
        type="button"
        onClick={onClear}
        disabled={!isFiltering}
        aria-label="Clear all filters"
        className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
          isFiltering
            ? "border-edge bg-surface-2 text-fg hover:border-accent/50 hover:text-accent"
            : "cursor-not-allowed border-edge/40 bg-surface-2/40 text-muted opacity-40"
        }`}
      >
        Clear
      </button>
    </div>
  );
}
