import { useState, useMemo, useCallback } from "react";
import type { SketchMeta } from "../../scripts/lib/meta";

export interface FilterState {
  name: string;
  types: string[];
  tags: string[];
  authors: string[];
}

export const EMPTY_FILTER: FilterState = { name: "", types: [], tags: [], authors: [] };

export function useSketchFilter(data: SketchMeta[]) {
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER);

  const availableTypes = useMemo(
    () => [...new Set(data.map((s) => s.type))].sort(),
    [data],
  );

  const availableTags = useMemo(
    () => [...new Set(data.flatMap((s) => s.tags ?? []))].sort(),
    [data],
  );

  const availableAuthors = useMemo(
    () => [...new Set(data.map((s) => s.createdBy))].sort(),
    [data],
  );

  const isFiltering =
    filter.name !== "" ||
    filter.types.length > 0 ||
    filter.tags.length > 0 ||
    filter.authors.length > 0;

  const filteredData = useMemo(() => {
    if (!isFiltering) return data;
    const { name, types, tags, authors } = filter;
    return data.filter(
      (sketch) =>
        (!name || sketch.name.toLowerCase().includes(name.toLowerCase())) &&
        (types.length === 0 || types.includes(sketch.type)) &&
        (tags.length === 0 || tags.every((t) => (sketch.tags ?? []).includes(t))) &&
        (authors.length === 0 || authors.includes(sketch.createdBy)),
    );
  }, [data, filter, isFiltering]);

  const clearFilters = useCallback(() => setFilter(EMPTY_FILTER), []);

  return {
    filter,
    setFilter,
    filteredData,
    availableTypes,
    availableTags,
    availableAuthors,
    isFiltering,
    clearFilters,
  };
}
