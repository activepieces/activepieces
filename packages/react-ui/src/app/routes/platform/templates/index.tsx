import LockedFeatureGuard from "@/app/components/locked-feature-guard";
import { ConfirmationDeleteDialog } from "@/components/delete-dialog";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagInput } from "@/components/ui/tag-input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { INTERNAL_ERROR_TOAST, useToast } from "@/components/ui/use-toast";
import { PieceIconList } from "@/features/pieces/components/piece-icon-list";
import { templatesApi } from "@/features/templates/lib/templates-api";
import { platformHooks } from "@/hooks/platform-hooks";
import { formatUtils } from "@/lib/utils";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { useMutation } from "@tanstack/react-query";
import { Pencil, Plus, Trash } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { CreateFlowTemplateRequest } from "../../../../../../ee/shared/src";
import { FlowTemplate, TemplateType } from "../../../../../../shared/src";

export default function TemplatesPage() {
  const { platform } = platformHooks.useCurrentPlatform();

  const [refreshCount, setRefreshCount] = useState(0);

  const { toast } = useToast();

  const refreshData = () => {
    setRefreshCount(prev => prev + 1);
  };

  const { mutate: deleteTemplate, isPending: isDeleting } = useMutation({
    mutationKey: ['delete-template'],
    mutationFn: async (templateId: string) => {
      await templatesApi.delete(templateId);
    },
    onSuccess: () => {
      refreshData();
      toast({
        title: 'Success',
        description: 'Template deleted successfully',
        duration: 3000,
      });
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  })


  const isEnabled = platform.manageTemplatesEnabled
  return <LockedFeatureGuard
    locked={!isEnabled}
    lockTitle="Unlock Templates"
    lockDescription="Convert the most common automations into reusable templates 1 click away from your users"
    lockVideoUrl="https://cdn.activepieces.com/videos/showcase/templates.mp4"
  >
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between flex-row">
        <span className="text-2xl py-2">Templates</span>
        <UpsertNewTemplateDialog onDone={() => refreshData()}>
          <Button variant="outline" size="sm" className="flex items-center justify-center gap-2">
            <Plus className="size-4" />
            New Template
          </Button>
        </UpsertNewTemplateDialog>
      </div>
      <DataTable
        columns={[
          {
            accessorKey: 'name',
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="Name" />
            ),
            cell: ({ row }) => {
              return <div className="text-left">{row.original.name}</div>;
            },
          },
          {
            accessorKey: 'createdAt',
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="Created" />
            ),
            cell: ({ row }) => {
              return <div className="text-left">{formatUtils.formatDate(new Date(row.original.created))}</div>;
            },
          },
          {
            accessorKey: 'pieces',
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="Pieces" />
            ),
            cell: ({ row }) => {
              return <PieceIconList trigger={row.original.template.trigger} maxNumberOfIconsToShow={2} />;
            },
          },
        ]}
        fetchData={async () => {
          const response = await templatesApi.list({});
          return { data: response.data, next: null, previous: null };
        }}
        refresh={refreshCount}
        actions={[
          (row) => {
            return <div className="flex items-end justify-end">
              <Tooltip>
                <TooltipTrigger>
                  <UpsertNewTemplateDialog onDone={() => refreshData()} template={row}>
                    <Button variant="ghost" className="size-8 p-0">
                      <Pencil className="size-4" />
                    </Button>
                  </UpsertNewTemplateDialog>
                </TooltipTrigger>
                <TooltipContent side="bottom">Edit template</TooltipContent>
              </Tooltip>
            </div>
          },
          (row) => {
            return <div className="flex items-end justify-end">
              <Tooltip>
                <TooltipTrigger>
                  <ConfirmationDeleteDialog
                    title="Delete Template"
                    message="Are you sure you want to delete this template?"
                    entityName={`Template ${row.name}`}
                    mutationFn={async () => {
                      deleteTemplate(row.id)
                    }}
                  >
                    <Button disabled={isDeleting} variant="ghost" className="size-8 p-0">
                      <Trash className="size-4 text-destructive" />
                    </Button>
                  </ConfirmationDeleteDialog>
                </TooltipTrigger>
                <TooltipContent side="bottom">Delete template</TooltipContent>
              </Tooltip>
            </div>
          }
        ]}
      />
    </div>
  </LockedFeatureGuard >
}

const UpsertNewTemplateDialog = ({ children, onDone, template }: { children: React.ReactNode, onDone: () => void, template?: CreateFlowTemplateRequest }) => {
  const [open, setOpen] = useState(false);
  const form = useForm<CreateFlowTemplateRequest>({
    defaultValues: {
      ...template,
      type: TemplateType.PLATFORM,
    },
    resolver: typeboxResolver(CreateFlowTemplateRequest),
  });
  const { mutate, isPending } = useMutation({
    mutationKey: ['create-template'],
    mutationFn: async () => {
      await templatesApi.create(form.getValues())
      onDone()
    },
    onSuccess: () => {
      setOpen(false);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open)
        form.reset();
      }}
    >
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Template</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            className="grid space-y-4"
            onSubmit={(e) => e.preventDefault()}
          >
            <FormField name="template.displayName" render={({ field }) => (
              <FormItem className="grid space-y-2">
                <Label htmlFor="name">
                  Name
                </Label>
                <Input
                  {...field}
                  required
                  id="name"
                  placeholder="Template Name"
                  className="rounded-sm"
                />
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="description" render={({ field }) => (
              <FormItem className="grid space-y-2">
                <Label htmlFor="description">
                  Description
                </Label>
                <Input
                  {...field}
                  required
                  id="description"
                  placeholder="Template Description"
                  className="rounded-sm"
                />
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="blogUrl" render={({ field }) => (
              <FormItem className="grid space-y-2">
                <Label htmlFor="blogUrl">
                  Blog URL
                </Label>
                <Input
                  {...field}
                  required
                  id="blogUrl"
                  placeholder="Template Blog URL"
                  className="rounded-sm"
                />
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="template" render={({ field }) => (
              <FormItem className="grid space-y-2">
                <Label htmlFor="flow">
                  Flow
                </Label>
                <Input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    e.target.files && e.target.files[0].text().then((text) => {
                      const json = JSON.parse(text) as FlowTemplate;
                      json.template.displayName = form.getValues().template.displayName;
                      field.onChange(json.template);
                      console.log(json.template);
                    });
                  }}
                  required
                  id="flow"
                  placeholder="Template Flow"
                  className="rounded-sm"
                />
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="tags" render={({ field }) => (
              <FormItem className="grid space-y-2">
                <Label htmlFor="tags">
                  Tags
                </Label>
                <TagInput
                  onChange={tags => field.onChange(tags)}
                  value={field.value}
                />
                <FormMessage />
              </FormItem>
            )} />
            {form?.formState?.errors?.root?.serverError && (
              <FormMessage>
                {form.formState.errors.root.serverError.message}
              </FormMessage>
            )}
          </form>
        </Form>
        <DialogFooter>
          <Button
            variant={'outline'}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            disabled={isPending || !form.formState.isValid}
            loading={isPending}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              mutate();
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
