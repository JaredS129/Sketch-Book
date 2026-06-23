import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getSketch } from "../sketches";
import { SketchCanvas } from "../components/SketchCanvas";
import { MetaPanel } from "../components/MetaPanel";
import { NativeCodePanel } from "../components/NativeCodePanel";
import { NotFoundPage } from "./NotFoundPage";
import { runnerFromType } from "../../scripts/lib/meta";
import { SketchFormDialog, type SketchFormValues } from "../components/SketchFormDialog";
import { DeleteConfirmDialog } from "../components/DeleteConfirmDialog";
import { Button } from "../components/ui/Button";

/** Runs a single sketch (auto-start) and shows its five metadata fields. */
export function SketchPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sketch = id ? getSketch(id) : undefined;

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!sketch) return <NotFoundPage />;

  async function handleEdit(values: SketchFormValues) {
    const res = await fetch(`/api/sketches/${sketch!.meta.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: values.name, type: values.type, tags: values.tags }),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error ?? "Failed to edit sketch");
    setEditOpen(false);
  }

  async function handleDelete() {
    const res = await fetch(`/api/sketches/${sketch!.meta.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error ?? "Failed to delete sketch");
    navigate("/");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{sketch.meta.name}</h1>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => setEditOpen(true)} className="text-sm">
            Edit
          </Button>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="text-sm text-red-500 transition-colors hover:text-red-400"
          >
            Delete
          </button>
          <Link to="/" className="text-sm text-muted hover:text-fg">
            ← All sketches
          </Link>
        </div>
      </div>

      <div className="w-fit max-w-full space-y-6">
        <SketchCanvas sketchId={sketch.meta.id} load={sketch.load} runner={runnerFromType(sketch.meta.type)} />
        <NativeCodePanel sketchId={sketch.meta.id} loadSource={sketch.loadSource} runner={runnerFromType(sketch.meta.type)} />
        <div>
          <h2 className="mb-4 text-sm font-semibold text-muted">Metadata</h2>
          <MetaPanel meta={sketch.meta} />
        </div>
      </div>

      {editOpen && (
        <SketchFormDialog
          mode="edit-name-only"
          title="Edit Sketch"
          submitLabel="Save"
          initialValues={{ name: sketch.meta.name, type: sketch.meta.type, tags: sketch.meta.tags ?? [] }}
          onSubmit={handleEdit}
          onClose={() => setEditOpen(false)}
        />
      )}

      {deleteOpen && (
        <DeleteConfirmDialog
          sketchName={sketch.meta.name}
          onConfirm={handleDelete}
          onClose={() => setDeleteOpen(false)}
        />
      )}
    </div>
  );
}
