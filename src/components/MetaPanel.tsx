import type { SketchMeta, SketchType } from "../../scripts/lib/meta";
import { SketchTypeLabel } from "./SketchTypeLabel";
import { formatDate } from "../lib/format";

const DATE_KEYS = new Set<keyof SketchMeta>(["dateCreated", "dateUpdated"]);

/** The five metadata fields, in display order. Shared by the table + sketch page. */
export const META_FIELDS = [
  { key: "name", label: "Name" },
  { key: "id", label: "ID" },
  { key: "type", label: "Type" },
  { key: "dateCreated", label: "Created" },
  { key: "dateUpdated", label: "Updated" },
  { key: "createdBy", label: "Created by" },
  { key: "lastUpdatedBy", label: "Last updated by" },
  { key: "tags", label: "Tags" },
] as const satisfies ReadonlyArray<{ key: keyof SketchMeta; label: string }>;

/** Renders the five metadata fields as a definition list (sketch page, FR-007). */
export function MetaPanel({ meta }: { meta: SketchMeta }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
      {META_FIELDS.map(({ key, label }) => {
        if (key === "tags") {
          const tags = meta.tags ?? [];
          if (tags.length === 0) return null;
          return (
            <div key={key} className="contents">
              <dt className="text-muted">{label}</dt>
              <dd className="font-medium text-accent">{tags.join(", ")}</dd>
            </div>
          );
        }
        return (
          <div key={key} className="contents">
            <dt className="text-muted">{label}</dt>
            <dd className={`font-medium ${DATE_KEYS.has(key) ? "text-muted" : "text-fg"}`}>
              {key === "type" ? (
                <SketchTypeLabel type={meta.type as SketchType} />
              ) : DATE_KEYS.has(key) ? (
                formatDate(meta[key] as string)
              ) : (
                meta[key]
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
