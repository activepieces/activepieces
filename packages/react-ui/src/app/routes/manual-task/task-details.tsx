import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  CheckIcon,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  CircleX,
  Clock2,
  Loader,
  Send,
  UserRoundPen,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';

import {
  RightDrawer,
  RightDrawerContent,
  RightDrawerHeader,
  RightDrawerTitle,
} from '@/components/right-drawer';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable-panel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { StatusIconWithText } from '@/components/ui/status-icon-with-text';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { flowRunsApi } from '@/features/flow-runs/lib/flow-runs-api';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { manualTaskApi } from '@/features/manual-tasks/lib/manual-task-api';
import { manualTaskCommentApi } from '@/features/manual-tasks/lib/manual-task-comment-api';
import { flagsHooks } from '@/hooks/flags-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { formatUtils } from '@/lib/utils';
import {
  FlowRunStatus,
  isFailedState,
  PopulatedFlow,
  FlowRun,
  isNil,
  ManualTaskWithAssignee,
  StatusOption,
  UNRESOLVED_STATUS,
  STATUS_COLORS,
  ApFlagId,
  ApEdition,
} from '@activepieces/shared';

import { Comments } from './comment/comments';

type TaskDetailsProps = {
  open: boolean;
  currentTask: ManualTaskWithAssignee;
  isTesting?: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  setIsStatusChanged?: () => void;
};

function TaskDetails({
  open,
  currentTask,
  isTesting = false,
  onOpenChange,
  onClose,
  onNext,
  onPrevious,
  setIsStatusChanged,
}: TaskDetailsProps) {
  const [task, setTask] = useState<ManualTaskWithAssignee>(currentTask);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const { data: currentUser } = userHooks.useCurrentUser();
  const queryClient = useQueryClient();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  const { data } = useQuery<
    {
      run: FlowRun;
      flow: PopulatedFlow;
    },
    Error
  >({
    queryKey: ['run', task.runId],
    queryFn: async () => {
      const flowRun = await flowRunsApi.getPopulated(task.runId!);
      const flow = await flowsApi.get(flowRun.flowId, {
        versionId: flowRun.flowVersionId,
      });
      return {
        run: flowRun,
        flow: flow,
      };
    },
    staleTime: 0,
    gcTime: 0,
    enabled: !isNil(task.runId),
  });

  const { mutate: createComment } = useMutation({
    mutationFn: async (content: string) => {
      await manualTaskCommentApi.create(task.id, {
        content: content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', task.id] });
    },
  });

  const { mutate: getTask } = useMutation({
    mutationFn: async () => {
      const response = await manualTaskApi.get(task.id);
      return response;
    },
    onSuccess: (data) => {
      setTask({
        ...currentTask,
        ...data,
      });
    },
  });

  const { mutate: updateStatus, isPending: isUpdatingStatus } = useMutation({
    mutationFn: async (status: StatusOption) => {
      await manualTaskApi.update(task.id, {
        status: status,
      });
      if (isTesting) {
        setTask({
          ...task,
          status: status,
        });
        setTimeout(() => {
          setIsStatusChanged?.();
        }, 2000);
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['manualTasks'] });
      if (!isTesting) {
        getTask();
      }
    },
  });

  return (
    <RightDrawer
      dismissible={false}
      open={open}
      onOpenChange={onOpenChange}
      className="w-1/2 max-w-3xl px-6"
      onClose={onClose}
    >
      <RightDrawerContent>
        <div className="w-full h-full">
          <div className="flex justify-between py-5">
            <Button
              variant="outline"
              className="px-4 h-8 w-24 flex items-center justify-center gap-1"
              onClick={onClose}
            >
              <X className="h-4 w-4 rounded-full" />
              <span className="text-sm">Close</span>
            </Button>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                className="text-primary h-8 w-8 p-0 flex items-center justify-center"
                onClick={() => {
                  onPrevious();
                  getTask();
                }}
              >
                <ChevronUp className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                className="text-primary h-8 w-8 p-0 flex items-center justify-center"
                onClick={() => {
                  onNext();
                  getTask();
                }}
              >
                <ChevronDown className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <RightDrawerHeader className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-2">
              <Clock2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {formatUtils.formatDateToAgo(new Date(task.created))}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <RightDrawerTitle>{task.title}</RightDrawerTitle>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <UserRoundPen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Assigned to
                </span>
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
                {!isNil(data) && (
                  <Tooltip>
                    <TooltipTrigger>
                      {data?.run.status &&
                        data?.run.status === FlowRunStatus.RUNNING && (
                          <Loader className="h-4 w-4" />
                        )}
                      {data?.run.status && isFailedState(data?.run.status) && (
                        <CircleX className="h-4 w-4 text-destructive" />
                      )}
                      {data?.run.status &&
                        data?.run.status === FlowRunStatus.SUCCEEDED && (
                          <CircleCheck className="h-4 w-4 text-success" />
                        )}
                    </TooltipTrigger>
                    <TooltipContent>
                      {data?.run.status &&
                        data?.run.status === FlowRunStatus.RUNNING && (
                          <span className="text-xs">Flow is running</span>
                        )}
                      {data?.run.status && isFailedState(data?.run.status) && (
                        <span className="text-xs">Flow failed</span>
                      )}
                      {data?.run.status &&
                        data?.run.status === FlowRunStatus.SUCCEEDED && (
                          <span className="text-xs">Flow succeeded</span>
                        )}
                    </TooltipContent>
                  </Tooltip>
                )}
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
                            <span className="text-sm">
                              {' '}
                              {task.status.name}{' '}
                            </span>
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
          </RightDrawerHeader>

          <Separator className="mt-4 mb-6" />

          {edition === ApEdition.COMMUNITY && (
            <div className="text-sm leading-6">
              <ScrollArea className="h-[420px]">{task.description}</ScrollArea>
            </div>
          )}

          {edition !== ApEdition.COMMUNITY && (
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={50}>
                <div className="text-sm leading-6">
                  <ScrollArea className="h-[420px]">
                    {task.description}
                  </ScrollArea>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={100} minSize={50}>
                <Comments task={task} />
              </ResizablePanel>
            </ResizablePanelGroup>
          )}
        </div>
        {edition !== ApEdition.COMMUNITY && (
          <div className="relative w-full mb-5">
            <Textarea
              className="w-full focus:outline-none pb-10 pt-3 border rounded-xl bg-gray-100 dark:bg-gray-700 dark:text-gray-100 pr-12 resize-none"
              minRows={1}
              autoFocus={true}
              maxRows={4}
              placeholder={t('Write a comment...')}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === 'Enter' &&
                  !e.shiftKey &&
                  inputMessage.length > 0
                ) {
                  createComment(inputMessage);
                  setInputMessage('');
                  e.preventDefault();
                }
              }}
              value={inputMessage}
              ref={textAreaRef}
            />
            <Button
              variant="transparent"
              className="absolute bottom-0 right-0"
              disabled={inputMessage.length === 0}
              onClick={() => {
                createComment(inputMessage);
                setInputMessage('');
              }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </RightDrawerContent>
    </RightDrawer>
  );
}

export { TaskDetails };
