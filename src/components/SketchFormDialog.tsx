import { useEffect, useId, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { slugify, isValidSlug } from "../../scripts/lib/slug";
import { SKETCH_TYPES, type SketchType } from "../../scripts/lib/meta";
import { Button } from "./ui/Button";

export type FormMode = "create" | "duplicate" | "edit-full" | "edit-name-only";

export interface SketchFormValues {
  name: string;
  id: string;
  type: SketchType;
}

interface Props {
  mode: FormMode;
  initialValues?: Partial<SketchFormValues>;
  title: string;
  submitLabel: string;
  onSubmit(values: SketchFormValues): Promise<void>;
  onClose(): void;
}

const showSlug = (mode: FormMode) => mode !== "edit-name-only";
const showType = (mode: FormMode) => mode === "create";

export function SketchFormDialog({
  mode,
  initialValues,
  title,
  submitLabel,
  onSubmit,
  onClose,
}: Props) {
  const nameId = useId();
  const slugId = useId();
  const typeId = useId();

  const [name, setName] = useState(initialValues?.name ?? "");
  const [id, setId] = useState(initialValues?.id ?? "");
  const [type, setType] = useState<SketchType>(initialValues?.type ?? "p5");
  const [slugDirty, setSlugDirty] = useState(
    mode === "edit-full" || mode === "duplicate" ? true : false,
  );
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const slugVisible = showSlug(mode);
  const typeVisible = showType(mode);

  // Auto-derive slug from name unless user has manually edited it
  useEffect(() => {
    if (!slugDirty && slugVisible) {
      setId(slugify(name));
    }
  }, [name, slugDirty, slugVisible]);

  const nameEmpty = name.trim() === "";
  const slugInvalid = slugVisible && !isValidSlug(id);
  const canSubmit = !nameEmpty && (!slugVisible || !slugInvalid) && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setServerError("");
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), id, type });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-edge bg-surface p-6 shadow-xl focus:outline-none"
          onEscapeKeyDown={onClose}
        >
          <Dialog.Title className="mb-5 text-lg font-semibold text-fg">
            {title}
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1">
              <label htmlFor={nameId} className="text-sm font-medium text-fg">
                Name
              </label>
              <input
                id={nameId}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Sketch"
                autoFocus
                className="w-full rounded-md border border-edge bg-surface-2 px-3 py-2 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none"
              />
              {nameEmpty && name !== "" && (
                <p className="text-xs text-red-400">Name is required</p>
              )}
            </div>

            {/* Slug / ID */}
            {slugVisible && (
              <div className="space-y-1">
                <label htmlFor={slugId} className="text-sm font-medium text-fg">
                  ID (slug)
                </label>
                <input
                  id={slugId}
                  type="text"
                  value={id}
                  onChange={(e) => {
                    setSlugDirty(true);
                    setId(e.target.value);
                  }}
                  placeholder="my-sketch"
                  className="w-full rounded-md border border-edge bg-surface-2 px-3 py-2 font-mono text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none"
                />
                {slugInvalid && id !== "" && (
                  <p className="text-xs text-red-400">
                    Must be lowercase kebab-case (e.g. my-sketch)
                  </p>
                )}
              </div>
            )}

            {/* Type — only shown on create/duplicate; not editable after creation */}
            {typeVisible && (
              <div className="space-y-1">
                <label htmlFor={typeId} className="text-sm font-medium text-fg">
                  Type
                </label>
                <select
                  id={typeId}
                  value={type}
                  onChange={(e) => setType(e.target.value as SketchType)}
                  className="w-full rounded-md border border-edge bg-surface-2 px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
                >
                  {SKETCH_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Server error */}
            {serverError && (
              <p className="rounded-md border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-400">
                {serverError}
              </p>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-1">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                {submitting ? "Saving…" : submitLabel}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
