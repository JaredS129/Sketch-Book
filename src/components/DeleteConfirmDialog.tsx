import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { Button } from "./ui/Button";

interface Props {
  sketchName: string;
  onConfirm(): Promise<void>;
  onClose(): void;
}

export function DeleteConfirmDialog({ sketchName, onConfirm, onClose }: Props) {
  const [deleting, setDeleting] = useState(false);

  async function handleConfirm() {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-edge bg-surface p-6 shadow-xl focus:outline-none"
          onEscapeKeyDown={onClose}
        >
          <Dialog.Title className="mb-2 text-lg font-semibold text-fg">
            Delete sketch?
          </Dialog.Title>
          <Dialog.Description className="mb-6 text-sm text-muted">
            <span className="font-medium text-fg">{sketchName}</span> will be
            permanently deleted. This cannot be undone.
          </Dialog.Description>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={deleting}>
              Cancel
            </Button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={deleting}
              className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
