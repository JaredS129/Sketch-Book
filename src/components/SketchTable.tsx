import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import type { SketchMeta } from "../../scripts/lib/meta";
import { slugify } from "../../scripts/lib/slug";
import { SketchFormDialog, type SketchFormValues } from "./SketchFormDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { SketchTypeLabel } from "./SketchTypeLabel";

const columnHelper = createColumnHelper<SketchMeta>();

function IconButton({
  label,
  onClick,
  destructive = false,
  children,
}: {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      className={
        destructive
          ? "rounded p-1 text-red-500 transition-colors hover:bg-red-950/40 hover:text-red-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red-500"
          : "rounded p-1 text-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
      }
    >
      {children}
    </button>
  );
}

function CopyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 11V2h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path
        d="M10.586 2.586a2 2 0 012.828 2.828L5 13.828l-3.5.672.672-3.5L10.586 2.586z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M2 4h11M5 4V2.5a.5.5 0 01.5-.5h4a.5.5 0 01.5.5V4M6 7v4M9 7v4M3 4l.8 8.5a1 1 0 001 .9h5.4a1 1 0 001-.9L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type DialogState =
  | { type: "none" }
  | { type: "duplicate"; meta: SketchMeta }
  | { type: "edit"; meta: SketchMeta }
  | { type: "delete"; meta: SketchMeta };

/** Sortable home table; clicking a row navigates to that sketch. */
export function SketchTable({ data }: { data: SketchMeta[] }) {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "dateUpdated", desc: true },
  ]);
  const [dialog, setDialog] = useState<DialogState>({ type: "none" });

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", { header: "Name" }),
      columnHelper.accessor("type", {
        header: "Type",
        cell: ({ getValue }) => <SketchTypeLabel type={getValue()} />,
      }),
      columnHelper.accessor("dateCreated", { header: "Created" }),
      columnHelper.accessor("dateUpdated", { header: "Updated" }),
      columnHelper.accessor("createdBy", { header: "Created by" }),
      columnHelper.accessor("lastUpdatedBy", { header: "Last updated by" }),
      columnHelper.display({
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const meta = row.original;
          return (
            <div className="flex items-center gap-1">
              <IconButton
                label={`Duplicate "${meta.name}"`}
                onClick={() => setDialog({ type: "duplicate", meta })}
              >
                <CopyIcon />
              </IconButton>
              <IconButton
                label={`Edit "${meta.name}"`}
                onClick={() => setDialog({ type: "edit", meta })}
              >
                <EditIcon />
              </IconButton>
              <IconButton
                label={`Delete "${meta.name}"`}
                onClick={() => setDialog({ type: "delete", meta })}
                destructive
              >
                <TrashIcon />
              </IconButton>
            </div>
          );
        },
      }),
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  async function handleDuplicate(
    sourceId: string,
    values: SketchFormValues,
  ) {
    const res = await fetch(`/api/sketches/${sourceId}/duplicate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: values.name, id: values.id }),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error ?? "Failed to duplicate sketch");
    setDialog({ type: "none" });
  }

  async function handleEdit(currentId: string, values: SketchFormValues) {
    const body: Record<string, string> = { name: values.name, type: values.type };
    if (values.id !== currentId) body.newId = values.id;
    const res = await fetch(`/api/sketches/${currentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error ?? "Failed to edit sketch");
    setDialog({ type: "none" });
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/sketches/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error ?? "Failed to delete sketch");
    setDialog({ type: "none" });
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-edge">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-surface-2 text-left text-muted">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={
                      header.column.getCanSort()
                        ? header.column.getToggleSortingHandler()
                        : undefined
                    }
                    className={`select-none px-4 py-3 font-medium ${header.column.getCanSort() ? "cursor-pointer hover:text-fg" : ""}`}
                  >
                    <span>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </span>
                    {header.column.getCanSort() && (
                      <span aria-hidden="true">
                        {{ asc: " ↑", desc: " ↓" }[
                          header.column.getIsSorted() as string
                        ] ?? ""}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                role="link"
                tabIndex={0}
                onClick={() => navigate(`/sketch/${row.original.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/sketch/${row.original.id}`);
                  }
                }}
                className="cursor-pointer border-t border-edge bg-surface transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-4 py-3 text-fg"
                    onClick={
                      cell.column.id === "actions"
                        ? (e) => e.stopPropagation()
                        : undefined
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dialog.type === "duplicate" && (
        <SketchFormDialog
          mode="duplicate"
          title="Duplicate Sketch"
          submitLabel="Duplicate"
          initialValues={{
            name: `${dialog.meta.name} - Copy`,
            id: slugify(`${dialog.meta.name} - Copy`),
            type: dialog.meta.type,
          }}
          onSubmit={(values) => handleDuplicate(dialog.meta.id, values)}
          onClose={() => setDialog({ type: "none" })}
        />
      )}

      {dialog.type === "edit" && (
        <SketchFormDialog
          mode="edit-full"
          title="Edit Sketch"
          submitLabel="Save"
          initialValues={{
            name: dialog.meta.name,
            id: dialog.meta.id,
            type: dialog.meta.type,
          }}
          onSubmit={(values) => handleEdit(dialog.meta.id, values)}
          onClose={() => setDialog({ type: "none" })}
        />
      )}

      {dialog.type === "delete" && (
        <DeleteConfirmDialog
          sketchName={dialog.meta.name}
          onConfirm={() => handleDelete(dialog.meta.id)}
          onClose={() => setDialog({ type: "none" })}
        />
      )}
    </>
  );
}
