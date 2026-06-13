"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { updateAppAction } from "@/lib/actions/apps";
import type { Application, Category } from "@/types";

interface AppEditFormProps {
  app: Application;
  categories: Category[];
}

export function AppEditForm({ app, categories }: AppEditFormProps) {
  const [state, formAction, pending] = useActionState(updateAppAction, {});

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="app_id" value={app.id} />

      {state.error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
          {state.success}
        </div>
      )}

      <Card>
        <h2 className="mb-6 text-lg font-semibold">App Information</h2>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">App Name</label>
              <Input
                name="name"
                defaultValue={app.name}
                required
                maxLength={100}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Category</label>
              <Select name="category_id" defaultValue={app.category_id ?? ""}>
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Short Description</label>
            <Input
              name="short_description"
              defaultValue={app.short_description}
              required
              maxLength={200}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Full Description</label>
            <Textarea
              name="full_description"
              defaultValue={app.full_description}
              rows={6}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Version</label>
              <Input
                name="version"
                defaultValue={app.current_version ?? ""}
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Tags</label>
              <Input
                name="tags"
                defaultValue={app.tags?.join(", ") ?? ""}
                placeholder="utility, productivity, free"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-6 text-lg font-semibold">Links & Contact</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Developer Website</label>
            <Input
              name="developer_website"
              type="url"
              defaultValue={app.developer_website ?? ""}
              placeholder="https://yourwebsite.com"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Privacy Policy URL</label>
            <Input
              name="privacy_policy_url"
              type="url"
              defaultValue={app.privacy_policy_url ?? ""}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Support Email</label>
            <Input
              name="support_email"
              type="email"
              defaultValue={app.support_email ?? ""}
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
}
