import {
  isNil,
  SeekPage,
  PopulatedFlow,
  ProjectType,
  ProjectWithLimits,
} from '@activepieces/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Search, Workflow } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { workersApi } from '@/features/platform-admin/api/workers-api';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

import { ProjectAvatar } from './project-avatar';

const DIALOG_PAGE_SIZE = 100;

export function AssignFlowsDialog({
  open,
  onOpenChange,
  groupLabel,
  allProjects,
}: AssignFlowsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <AssignFlowsContent
          key={open ? `open-${groupLabel}` : 'closed'}
          groupLabel={groupLabel}
          allProjects={allProjects}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
}

function AssignFlowsContent({
  groupLabel,
  allProjects,
  onOpenChange,
}: AssignFlowsContentProps) {
  const queryClient = useQueryClient();
  const defaultProject =
    allProjects.find((project) => project.type === ProjectType.TEAM) ??
    allProjects[0];
  const [selectedProjectId, setSelectedProjectId] = useState<
    string | undefined
  >(defaultProject?.id);
  const [search, setSearch] = useState('');
  const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(
    new Map(),
  );

  const { data: page, isLoading } = useQuery<SeekPage<PopulatedFlow>>({
    queryKey: ['assign-flows-dialog', selectedProjectId, search],
    queryFn: () =>
      api.get<SeekPage<PopulatedFlow>>('/v1/flows', {
        projectId: selectedProjectId,
        limit: DIALOG_PAGE_SIZE,
        name: search || undefined,
      }),
    enabled: !isNil(selectedProjectId),
  });
  const flows = page?.data ?? [];

  const isInGroup = (flow: PopulatedFlow): boolean =>
    pendingChanges.get(flow.id) ?? flow.workerGroupId === groupLabel;

  const toggleFlow = (flow: PopulatedFlow) => {
    setPendingChanges((prev) => {
      const next = new Map(prev);
      const desired = !isInGroup(flow);
      if (desired === (flow.workerGroupId === groupLabel)) {
        next.delete(flow.id);
      } else {
        next.set(flow.id, desired);
      }
      return next;
    });
  };

  const handleSave = async () => {
    try {
      for (const [flowId, assign] of pendingChanges) {
        await workersApi.assignFlow(flowId, assign ? groupLabel : null);
      }
      if (pendingChanges.size > 0) {
        await queryClient.invalidateQueries({
          queryKey: ['worker-groups-flows'],
        });
        toast.success(t('Saved'));
      }
      onOpenChange(false);
    } catch {
      toast.error(t('Failed to save'));
    }
  };

  const getSubtitle = (flow: PopulatedFlow): string => {
    if (flow.workerGroupId === groupLabel) {
      return t('in this group');
    }
    if (flow.workerGroupId) {
      return t('currently in {group} — will move here', {
        group: flow.workerGroupId.replaceAll('_', ' '),
      });
    }
    return t('project default');
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('Assign flows')}</DialogTitle>
        <DialogDescription>
          {t("These flows will run on this group's dedicated queue.")}
        </DialogDescription>
        <div className="inline-flex items-center gap-1.5 rounded-md bg-accent-3 px-2 py-1 text-sm font-medium text-accent-11 w-fit">
          <Workflow className="size-3.5 shrink-0" />
          {groupLabel.replaceAll('_', ' ')}
        </div>
      </DialogHeader>

      <div className="flex flex-col gap-3">
        <Select
          value={selectedProjectId}
          onValueChange={(projectId) => setSelectedProjectId(projectId)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('Select a project')} />
          </SelectTrigger>
          <SelectContent>
            {allProjects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                <div className="flex items-center gap-2 min-w-0">
                  <ProjectAvatar project={project} size="sm" />
                  <span className="truncate">{project.displayName}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-11" />
          <Input
            className="pl-8"
            placeholder={t('Search flows')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <ScrollArea className="h-64 rounded-md border">
          <div className="p-1">
            {!isLoading && flows.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-11">
                {t('No flows')}
              </p>
            )}
            {flows.map((flow) => {
              const isChecked = isInGroup(flow);
              const subtitle = getSubtitle(flow);
              const isCurrentGroup = flow.workerGroupId === groupLabel;

              return (
                <button
                  key={flow.id}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-gray-4 cursor-pointer"
                  onClick={() => toggleFlow(flow)}
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggleFlow(flow)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Workflow className="size-4 shrink-0 text-gray-11" />
                  <div className="flex min-w-0 flex-col">
                    <TextWithTooltip tooltipMessage={flow.version.displayName}>
                      <span className="text-sm font-medium truncate">
                        {flow.version.displayName}
                      </span>
                    </TextWithTooltip>
                    <span
                      className={cn('text-xs text-gray-11 truncate', {
                        'text-accent-11': isCurrentGroup,
                      })}
                    >
                      {subtitle}
                    </span>
                  </div>
                </button>
              );
            })}
            {!isNil(page?.next) && (
              <p className="py-2 text-center text-xs text-gray-11">
                {t('Showing the first {count} flows — search to narrow down', {
                  count: DIALOG_PAGE_SIZE,
                })}
              </p>
            )}
          </div>
        </ScrollArea>
      </div>

      <DialogFooter className="sm:justify-between">
        <span className="text-sm text-gray-11 self-center">
          {t('{count, plural, =1 {1 change} other {# changes}}', {
            count: pendingChanges.size,
          })}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('Cancel')}
          </Button>
          <Button
            {...adminControl(AdminControl.WORKERS_ASSIGN_SUBMIT)}
            type="button"
            onClick={handleSave}
          >
            {t('Save')}
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

type AssignFlowsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupLabel: string;
  allProjects: ProjectWithLimits[];
};

type AssignFlowsContentProps = {
  groupLabel: string;
  allProjects: ProjectWithLimits[];
  onOpenChange: (open: boolean) => void;
};
