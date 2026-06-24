import { useState, useMemo } from "react";
import { sketches, invalidSketches } from "../sketches";
import { SketchTable } from "../components/SketchTable";
import { EmptyState } from "../components/EmptyState";
import { SketchFormDialog } from "../components/SketchFormDialog";
import { SketchFilterBar } from "../components/SketchFilterBar";
import { Button } from "../components/ui/Button";
import type { SketchFormValues } from "../components/SketchFormDialog";
import { useSketchFilter } from "../hooks/useSketchFilter";

/** Home screen: table of all sketches, or an empty state when none exist. */
export function HomePage() {
  const data = useMemo(() => sketches.map((s) => s.meta), []);
  const {
    filter,
    setFilter,
    filteredData,
    availableTypes,
    availableTags,
    availableAuthors,
    isFiltering,
    clearFilters,
  } = useSketchFilter(data);
  const [createOpen, setCreateOpen] = useState(false);

  async function handleCreate(values: SketchFormValues) {
    const res = await fetch("/api/sketches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: values.name, id: values.id, type: values.type, tags: values.tags }),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error ?? "Failed to create sketch");
    setCreateOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sketches</h1>
          <p className="mt-1 text-sm text-muted">
            {isFiltering
              ? `${filteredData.length} of ${data.length} ${data.length === 1 ? "sketch" : "sketches"} · click a row to run`
              : `${data.length} ${data.length === 1 ? "sketch" : "sketches"} · click a row to run`}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>New Sketch</Button>
      </div>

      {data.length > 0 && (
        <SketchFilterBar
          filter={filter}
          onFilterChange={setFilter}
          availableTypes={availableTypes}
          availableTags={availableTags}
          availableAuthors={availableAuthors}
          isFiltering={isFiltering}
          onClear={clearFilters}
        />
      )}

      {data.length === 0 ? (
        <EmptyState />
      ) : filteredData.length === 0 ? (
        <div className="rounded-xl border border-edge bg-surface px-6 py-12 text-center">
          <p className="text-sm text-muted">No sketches match your filters.</p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-2 text-sm text-accent hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <SketchTable data={filteredData} />
      )}

      {invalidSketches.length > 0 && (
        <div className="rounded-lg border border-edge bg-surface p-4 text-sm text-muted">
          <p className="font-medium text-fg">
            {invalidSketches.length} folder
            {invalidSketches.length === 1 ? "" : "s"} skipped (invalid):
          </p>
          <ul className="mt-1 list-inside list-disc">
            {invalidSketches.map((s) => (
              <li key={s.id}>
                <span className="font-mono">{s.id}</span> — {s.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {createOpen && (
        <SketchFormDialog
          mode="create"
          title="New Sketch"
          submitLabel="Create"
          onSubmit={handleCreate}
          onClose={() => setCreateOpen(false)}
        />
      )}
    </div>
  );
}
