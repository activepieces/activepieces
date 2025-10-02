import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { OutgoingWebhook } from "@activepieces/ee-shared"
import { Project } from "@activepieces/shared"
import { MoreVertical, Pencil, Trash } from "lucide-react"
import { useState } from "react"
import { OutgoingWebhookDialog } from "./outgoing-webhook-dialog"
import { ConfirmationDeleteDialog } from "@/components/delete-dialog"
import { t } from "i18next"
import { outgoingWebhooksHooks } from "../lib/outgoing-webhooks-hooks"

const OutgoingWebhookActions = ({ webhook, projects }: { webhook: OutgoingWebhook, projects: Project[] }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { mutate: deleteWebhook, isPending: isDeleting } = outgoingWebhooksHooks.useDeleteOutgoingWebhook();

  return (
    <div className="flex justify-end">
      <DropdownMenu 
        modal={true} 
        open={dropdownOpen}
        onOpenChange={setDropdownOpen}
      >
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 text-primary">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>

          <OutgoingWebhookDialog webhook={webhook} projects={projects}>
            <DropdownMenuItem 
              onSelect={(e) => {
                e.preventDefault();
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              {t('Edit')}
            </DropdownMenuItem>
          </OutgoingWebhookDialog>

          <ConfirmationDeleteDialog
            title={t('Delete Webhook')}
            message={t('Are you sure you want to delete this webhook?')}
            entityName="webhook"
            showToast
            mutationFn={async () => {
              if (webhook) {
                deleteWebhook(webhook.id);
              }
            }}
            isDanger
          >
            <DropdownMenuItem
              className="text-destructive"
              onSelect={(e) => {
                e.preventDefault();
              }}
            >
              <Trash className="h-4 w-4 mr-2" />
              {t('Delete')}
            </DropdownMenuItem>
          </ConfirmationDeleteDialog>

        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default OutgoingWebhookActions