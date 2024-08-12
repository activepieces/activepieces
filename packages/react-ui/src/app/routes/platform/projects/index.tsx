import LockedFeatureGuard from "@/app/components/locked-feature-guard";
import { ConfirmationDeleteDialog } from "@/components/delete-dialog";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { platformHooks } from "@/hooks/platform-hooks";
import { projectHooks } from "@/hooks/project-hooks";
import { projectApi } from "@/lib/project-api";
import { formatUtils } from "@/lib/utils";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { CreatePlatformProjectRequest } from "../../../../../../ee/shared/src";

export default function ProjectsPage() {
  const { platform } = platformHooks.useCurrentPlatform();
  const [refreshCount, setRefreshCount] = useState(0);

  const { data: currentProject } = projectHooks.useCurrentProject();

  const refreshData = () => {
    setRefreshCount(prev => prev + 1);
  };

  const queryClient = useQueryClient();
  const { setCurrentProject } =
    projectHooks.useCurrentProject();
  const navigate = useNavigate()
  const isEnabled = platform.manageProjectsEnabled
  return <LockedFeatureGuard
    locked={!isEnabled}
    lockTitle="Unlock Projects"
    lockDescription="Orchestrate your automation teams across projects with their own flows, connections and usage quotas"
    lockVideoUrl="https://cdn.activepieces.com/videos/showcase/projects.mp4"
  >
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between flex-row">
        <span className="text-2xl py-2">Projects</span>
        <CreateNewProjectDialog onCreate={() => refreshData()}>
          <Button variant="outline" size="sm" className="flex items-center justify-center gap-2">
            <Plus className="size-4" />
            New Project
          </Button>
        </CreateNewProjectDialog>
      </div>
      <DataTable
        onRowClick={row => {
          setCurrentProject(queryClient, row)
          navigate("/")
        }}
        columns={[
          {
            accessorKey: 'name',
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="Name" />
            ),
            cell: ({ row }) => {
              return <div className="text-left">{row.original.displayName}</div>;
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
            accessorKey: 'members',
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="Members" />
            ),
            cell: ({ row }) => {
              return <div className="text-left">{row.original.usage.teamMembers}</div>;
            },
          },
          {
            accessorKey: 'tasks',
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="Tasks" />
            ),
            cell: ({ row }) => {
              return <div className="text-left">{formatUtils.formatNumber(row.original.usage.tasks)} / {formatUtils.formatNumber(row.original.plan.tasks)}</div>;
            },
          },
          {
            accessorKey: 'externalId',
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="External ID" />
            ),
            cell: ({ row }) => {
              return <div className="text-left">{row.original.externalId}</div>;
            },
          },
        ]}
        fetchData={() => projectApi.list({})}
        refresh={refreshCount}
        actions={[
          (row) => {
            return <div className="flex items-end justify-end">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" className="size-8 p-0" onClick={e => {
                    e.stopPropagation();
                    e.preventDefault();
                    setCurrentProject(queryClient, row)
                    navigate("/settings/general")
                  }}>
                    <Pencil className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Edit project</TooltipContent>
              </Tooltip>
            </div>
          },
          (row) => {
            const isActiveProject = row.id === currentProject?.id
            const deleteButton = (
              <Button disabled={isActiveProject} variant="ghost" className="size-8 p-0" onClick={e => {
                e.stopPropagation();
              }}>
                <Trash className="size-4 text-destructive" />
              </Button>
            );

            return <div className="flex items-end justify-end">
              <ConfirmationDeleteDialog
                title="Delete Project"
                message="Are you sure you want to delete this project?"
                entityName="Project"
                mutationFn={async () => {
                  await projectApi.delete(row.id)
                  refreshData()
                }}
              >
                {isActiveProject ? <Tooltip>
                  <TooltipTrigger>
                    {deleteButton}
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{isActiveProject ? "Cannot delete active project" : "Delete project"}</TooltipContent>
                </Tooltip> : deleteButton}
              </ConfirmationDeleteDialog>
            </div>
          }
        ]}
      />
    </div>
  </LockedFeatureGuard >
}

const CreateNewProjectDialog = ({ children, onCreate }: { children: React.ReactNode, onCreate: () => void }) => {
  const [open, setOpen] = useState(false);
  const form = useForm<CreatePlatformProjectRequest>({
    resolver: typeboxResolver(CreatePlatformProjectRequest),
  });
  const { mutate, isPending } = useMutation({
    mutationKey: ['create-project'],
    mutationFn: async () => {
      await projectApi.create(form.getValues())
      onCreate()
    },
    onSuccess: () => {
      setOpen(false);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => setOpen(open)}
    >
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            className="grid space-y-4"
            onSubmit={(e) => e.preventDefault()}
          >
            <FormField
              name="displayName"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="displayName">
                    Project Name
                  </Label>
                  <Input
                    {...field}
                    required
                    id="displayName"
                    placeholder="Project Name"
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
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
