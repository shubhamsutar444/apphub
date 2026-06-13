"use client";

import { useState, useActionState, useTransition } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { updateCategoryAction, deleteCategoryAction } from "@/lib/actions/admin";
import type { Category } from "@/types";

interface AdminCategoriesClientProps {
  categories: Category[];
}

function CategoryForm({
  category,
  onClose,
}: {
  category?: Category;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateCategoryAction, {});

  if (state.success) {
    onClose();
    return null;
  }

  return (
    <form action={formAction} className="space-y-4">
      {category && <input type="hidden" name="id" value={category.id} />}

      {state.error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium">Name *</label>
        <Input name="name" defaultValue={category?.name ?? ""} required placeholder="e.g. Games" />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium">Icon (emoji)</label>
        <Input name="icon" defaultValue={category?.icon ?? ""} placeholder="🎮" maxLength={4} />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium">Description</label>
        <Input name="description" defaultValue={category?.description ?? ""} placeholder="Short description" />
      </div>
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">Active</label>
        <select
          name="is_active"
          defaultValue={category?.is_active !== false ? "true" : "false"}
          className="rounded-lg border border-white/10 bg-secondary-900 px-3 py-1.5 text-sm"
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending} className="flex-1">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {category ? "Update" : "Create"} Category
        </Button>
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function AdminCategoriesClient({ categories }: AdminCategoriesClientProps) {
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    setDeleteId(null);
    startTransition(async () => {
      await deleteCategoryAction(id);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-secondary-400">{categories.length} categories</p>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <Card key={cat.id} className="group">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl">
                {cat.icon ?? "📱"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{cat.name}</p>
                  <Badge variant={cat.is_active ? "success" : "secondary"} className="shrink-0">
                    {cat.is_active ? "Active" : "Hidden"}
                  </Badge>
                </div>
                {cat.description && (
                  <p className="text-xs text-secondary-500 truncate">{cat.description}</p>
                )}
              </div>
            </div>
            <div className="mt-4 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setEditCategory(cat)}
                className="gap-1 flex-1"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => setDeleteId(cat.id)}
                disabled={isPending}
                className="gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Category">
        <CategoryForm onClose={() => setShowCreate(false)} />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editCategory}
        onClose={() => setEditCategory(null)}
        title="Edit Category"
      >
        {editCategory && (
          <CategoryForm category={editCategory} onClose={() => setEditCategory(null)} />
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Category" size="sm">
        <p className="text-secondary-400">
          Are you sure you want to delete this category? Apps in this category will become uncategorized.
        </p>
        <div className="mt-6 flex gap-3">
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => deleteId && handleDelete(deleteId)}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Delete
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}
