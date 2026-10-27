import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/client/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/client/components/ui/dialog";
import { Input } from "@/client/components/ui/input";
import { getStandardErrorMessage } from "@/client/lib/error-messages";
import { clearLastProjectId } from "@/client/lib/active-project";
import {
  createCustomerOrganization,
  switchOrganization,
} from "@/serverFunctions/organization";

export function CreateCustomerWorkspaceModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);

  async function create() {
    const trimmed = name.trim();
    if (!trimmed || pending) return;
    setPending(true);
    let created = false;
    try {
      const workspace = await createCustomerOrganization({
        data: { name: trimmed },
      });
      created = true;
      await switchOrganization({ data: workspace });
      clearLastProjectId();
      window.location.assign("/");
    } catch (error) {
      toast.error(
        created
          ? "Workspace created. Switch to it from the account menu."
          : getStandardErrorMessage(error),
      );
      if (created) window.location.reload();
      else setPending(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void create();
          }}
        >
          <DialogHeader>
            <DialogTitle>New customer workspace</DialogTitle>
            <DialogDescription>
              Keep this customer's projects separate. Invite only this customer
              and the agency staff who need access.
            </DialogDescription>
          </DialogHeader>
          <label
            htmlFor="customer-workspace-name"
            className="text-sm font-medium"
          >
            Customer name
          </label>
          <Input
            id="customer-workspace-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={120}
            required
            autoFocus
          />
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !name.trim()}>
              {pending ? "Creating..." : "Create workspace"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
