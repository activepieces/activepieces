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
  STATUS_COLORS,
  UNRESOLVED_STATUS,
  StatusOption,
  MarkdownVariant,
} from '@activepieces/shared';
import { Badge } from '@/components/ui/badge';

function ManualTaskTestingPage() {
  const { manualTaskId } = useParams();
  const { data: currentUser } = userHooks.useCurrentUser();

  const { isLoading, data: task, refetch } = useQuery({
    queryKey: ['manualTask', manualTaskId],
    queryFn: async () => {
      if (!manualTaskId) return null;
      return await manualTaskApi.get(manualTaskId);
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
      refetch();
      setTimeout(() => {
       // setIsStatusChanged(true);
      }, 2000);
    },
  });

  if (isLoading) {
    return <LoadingScreen />;
  }


  return (
    <>
      {!isLoading && !isNil(task) && (
        <div className="container mx-auto flex flex-col p-10">
          <div className="flex items-center mb-4">
            <Badge variant="outline" className="text-xs">Test Environment</Badge>
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
            <ScrollArea className="h-full">
              <ApMarkdown markdown={task.description ?? ''} variant={MarkdownVariant.BORDERLESS} />
            </ScrollArea>
          </div>
        </div>
      )}
    </>
  );
}

export { ManualTaskTestingPage };
