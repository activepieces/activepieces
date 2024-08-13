import LockedFeatureGuard from "@/app/components/locked-feature-guard";
import { ConfirmationDeleteDialog } from "@/components/delete-dialog";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { platformHooks } from "@/hooks/platform-hooks";
import { projectHooks } from "@/hooks/project-hooks";
import { projectApi } from "@/lib/project-api";
import { formatUtils, validationUtils } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { NewProjectDialog } from "./new-project-dialog";
import { useToast } from "@/components/ui/use-toast";

export default function ProjectsPage() {
  const { platform } = platformHooks.useCurrentPlatform();
  const [refreshCount, setRefreshCount] = useState(0);

  const { toast } = useToast();

  const errorToastMessage = (projectName: string, error: unknown): string | undefined => {
    if (validationUtils.isValidationError(error)) {
      console.error("Validation error", error);
      switch (error.response?.data?.params?.message) {
        case 'PROJECT_HAS_ENABLED_FLOWS':
          return `project (${projectName}) has enabled flows. Please disable them first.`;
        case 'ACTIVE_PROJECT':
          return `project (${projectName}) is active. Please switch to another project first.`;
      }
      return undefined;
    };
  }

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
        <NewProjectDialog onCreate={() => refreshData()}>
          <Button variant="outline" size="sm" className="flex items-center justify-center gap-2">
            <Plus className="size-4" />
            New Project
          </Button>
        </NewProjectDialog>
      </div>
      <DataTable
        onRowClick={async project => {
          await setCurrentProject(queryClient, project, false)
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
                  <Button variant="ghost" className="size-8 p-0" onClick={async e => {
                    e.stopPropagation();
                    e.preventDefault();
                    await setCurrentProject(queryClient, row, false)
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
                onError={(error) => {
                  toast({
                    title: 'Error',
                    description: errorToastMessage(row.displayName, error),
                    duration: 3000,
                  });
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
