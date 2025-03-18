import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  CheckIcon,
  UserRoundPen,
  Clock2,
  Loader,
  ChevronDown,
  Tag,
} from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { LoadingScreen } from '@/app/components/loading-screen';
import { ApMarkdown } from '@/components/custom/markdown';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { StatusIconWithText } from '@/components/ui/status-icon-with-text';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { manualTaskApi } from '@/features/manual-tasks/lib/manual-task-api';
import { userHooks } from '@/hooks/user-hooks';
import { formatUtils } from '@/lib/utils';
import {
  isNil,
  ManualTaskWithAssignee,
  STATUS_COLORS,
  UNRESOLVED_STATUS,
  StatusOption,
  MarkdownVariant,
} from '@activepieces/shared';

function ManualTaskTestingPage() {
  const [isStatusChanged, setIsStatusChanged] = useState(false);
  const [task, setTask] = useState<ManualTaskWithAssignee | null>(null);
  const { manualTaskId } = useParams();
  const { data: currentUser } = userHooks.useCurrentUser();

  const { isLoading } = useQuery({
    queryKey: ['manualTask', manualTaskId],
    queryFn: async () => {
      if (!manualTaskId) return null;
      const fetchedTask = await manualTaskApi.get(manualTaskId);
      setTask(fetchedTask);
      return fetchedTask;
    },
    enabled: !!manualTaskId,
    staleTime: 0,
  });

  const { mutate: updateStatus, isPending: isUpdatingStatus } = useMutation({
    mutationFn: async (status: StatusOption) => {
      if (!task) return;
      await manualTaskApi.update(task.id, {
        status: status,
      });
      setTask({
        ...task,
        status: status,
      });
      setTimeout(() => {
        setIsStatusChanged(true);
      }, 2000);
    },
  });

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isNil(task) || isStatusChanged) {
    return (
      <div className="flex w-full flex-col items-center justify-center py-8 text-center">
        <h3 className="text-lg font-medium">
          {t('Manual task already resolved')}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {t('You can only resolve a manual task once.')}
        </p>
      </div>
    );
  }

  return (
    <>
      {!isLoading && (
        <div className="container mx-auto flex flex-col p-10">
          <div className="mb-6 p-3 bg-slate-50 rounded gap-2 flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <Tag className="h-4 w-4 text-gray-600" />
              <div className="font-medium text-base">{t('Instructions')}</div>
            </div>
            <ApMarkdown
              markdown={
                'This is only for testing purposes. Do not use this page to resolve a manual task.'
              }
              variant={MarkdownVariant.INFO}
            />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Clock2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {formatUtils.formatDateToAgo(new Date(task.created))}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <span>{task.title}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <UserRoundPen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Assigned to</span>
              <span className="text-sm">
                {task.assignee && (
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="text-sm font-medium">
                        {task.assignee.firstName} {task.assignee.lastName}{' '}
                        {task.assigneeId === currentUser?.id ? '(Me)' : ''}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <span className="text-xs">{task.assignee.email}</span>
                    </TooltipContent>
                  </Tooltip>
                )}
              </span>
            </div>
            <span className="text-sm"> / </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status</span>
              {task.status.name === UNRESOLVED_STATUS.name && (
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button
                      variant="outline"
                      className="h-8 flex gap-2 items-center justify-between"
                    >
                      {isUpdatingStatus ? (
                        <Loader className="h-4 w-4" />
                      ) : (
                        <>
                          <span className="text-sm"> {task.status.name} </span>
                          <ChevronDown className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {task.statusOptions.map((status) => (
                      <DropdownMenuItem
                        key={status.name}
                        onClick={() => {
                          updateStatus(status);
                        }}
                      >
                        <span className="text-sm"> {status.name} </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {task.status.name !== UNRESOLVED_STATUS.name && (
                <StatusIconWithText
                  icon={CheckIcon}
                  text={task.status.name}
                  color={STATUS_COLORS[task.status.variant].color}
                  textColor={STATUS_COLORS[task.status.variant].textColor}
                />
              )}
            </div>
          </div>
          <Separator className="mt-4 mb-6" />

          <div className="text-sm leading-6">
            <ScrollArea className="h-[420px]">{task.description}</ScrollArea>
          </div>
        </div>
      )}
    </>
  );
}

export { ManualTaskTestingPage };
