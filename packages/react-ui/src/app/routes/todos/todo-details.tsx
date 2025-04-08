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

import { ApMarkdown } from '@/components/custom/markdown';
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
import { todosApi } from '@/features/todos/lib/todos-api';
import { todoCommentApi } from '@/features/todos/lib/todos-comment-api';
import { flagsHooks } from '@/hooks/flags-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { formatUtils } from '@/lib/utils';
import {
  FlowRunStatus,
  isFailedState,
  PopulatedFlow,
  FlowRun,
  isNil,
  TodoWithAssignee,
  StatusOption,
  UNRESOLVED_STATUS,
  STATUS_COLORS,
  ApFlagId,
  ApEdition,
  MarkdownVariant,
} from '@activepieces/shared';

import { Comments } from './comment/comments';

type TodoDetailsProps = {
  open: boolean;
  currentTodo: TodoWithAssignee;
  isTesting?: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  setIsStatusChanged?: () => void;
};

function TodoDetails({
  open,
  currentTodo,
  isTesting = false,
  onOpenChange,
  onClose,
  onNext,
  onPrevious,
  setIsStatusChanged,
}: TodoDetailsProps) {
  const [todo, setTodo] = useState<TodoWithAssignee>(currentTodo);
  const { data: currentUser } = userHooks.useCurrentUser();
  const queryClient = useQueryClient();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const [inputMessage, setInputMessage] = useState('');

  const { data } = useQuery<
    {
      run: FlowRun;
      flow: PopulatedFlow;
    },
    Error
  >({
    queryKey: ['run', todo.runId],
    queryFn: async () => {
      const flowRun = await flowRunsApi.getPopulated(todo.runId!);
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
    enabled: !isNil(todo.runId),
  });

  const { mutate: getTodo } = useMutation({
    mutationFn: async () => {
      const response = await todosApi.get(todo.id);
      return response;
    },
    onSuccess: (data) => {
      setTodo({
        ...currentTodo,
        ...data,
      });
    },
  });

  const { mutate: updateStatus, isPending: isUpdatingStatus } = useMutation({
    mutationFn: async (status: StatusOption) => {
      await todosApi.update(todo.id, {
        status: status,
      });
      if (isTesting) {
        setTodo({
          ...todo,
          status: status,
        });
        setTimeout(() => {
          setIsStatusChanged?.();
        }, 2000);
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      if (!isTesting) {
        getTodo();
      }
    },
  });

  const { mutate: createComment } = useMutation({
    mutationFn: async (content: string) => {
      await todoCommentApi.create(todo.id, {
        content: content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', todo.id] });
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
        <div className="flex flex-col w-full h-[100vh]">
          <div className="flex py-5 gap-2">
            <Button
              variant="outline"
              className="text-primary h-7 w-7 p-0 flex items-center justify-center"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="text-primary h-7 w-7 p-0 flex items-center justify-center"
              onClick={() => {
                onPrevious();
                getTodo();
              }}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="text-primary h-7 w-7 p-0 flex items-center justify-center"
              onClick={() => {
                onNext();
                getTodo();
              }}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
          <RightDrawerHeader className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <RightDrawerTitle>{todo.title}</RightDrawerTitle>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <UserRoundPen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Assigned to
                  </span>
                  <span className="text-sm">
                    {todo.assignee && (
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="text-sm font-medium">
                            {todo.assignee.firstName} {todo.assignee.lastName}{' '}
                            {todo.assigneeId === currentUser?.id ? '(Me)' : ''}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <span className="text-xs">{todo.assignee.email}</span>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </span>
                </div>
                <span className="text-sm"> / </span>
                <div className="flex items-center">
                  {!isNil(data) && (
                    <Tooltip>
                      <TooltipTrigger>
                        {data?.run.status &&
                          (data?.run.status === FlowRunStatus.RUNNING ||
                            data?.run.status === FlowRunStatus.PAUSED ||
                            data?.run.status === FlowRunStatus.STOPPED) && (
                            <Loader className="h-4 w-4 mr-2" />
                          )}
                        {data?.run.status &&
                          isFailedState(data?.run.status) && (
                            <CircleX className="h-4 w-4 text-destructive mr-2" />
                          )}
                        {data?.run.status &&
                          data?.run.status === FlowRunStatus.SUCCEEDED && (
                            <CircleCheck className="h-4 w-4 text-success mr-2" />
                          )}
                      </TooltipTrigger>
                      <TooltipContent>
                        {data?.run.status &&
                          data?.run.status === FlowRunStatus.RUNNING && (
                            <span className="text-xs">Flow is running</span>
                          )}

                        {data?.run.status &&
                          data?.run.status === FlowRunStatus.PAUSED && (
                            <span className="text-xs">Flow is paused</span>
                          )}

                        {data?.run.status &&
                          data?.run.status === FlowRunStatus.STOPPED && (
                            <span className="text-xs">Flow is stopped</span>
                          )}

                        {data?.run.status &&
                          isFailedState(data?.run.status) && (
                            <span className="text-xs">Flow failed</span>
                          )}
                        {data?.run.status &&
                          data?.run.status === FlowRunStatus.SUCCEEDED && (
                            <span className="text-xs">Flow succeeded</span>
                          )}
                      </TooltipContent>
                    </Tooltip>
                  )}
                  <span className="text-sm text-muted-foreground mr-2">
                    Status
                  </span>
                  {(todo.status.name === UNRESOLVED_STATUS.name ||
                    todo.status.continueFlow === false) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button
                          variant="outline"
                          className="h-8 px-2 flex gap-2 items-center justify-between border-1 border"
                          style={{
                            backgroundColor:
                              STATUS_COLORS[todo.status.variant].color,
                            color: STATUS_COLORS[todo.status.variant].textColor,
                          }}
                        >
                          {isUpdatingStatus ? (
                            <Loader className="h-4 w-4" />
                          ) : (
                            <>
                              <span className="text-sm">
                                {' '}
                                {todo.status.name}{' '}
                              </span>
                              <ChevronDown className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <div className="flex flex-col gap-1">
                          {todo.statusOptions.map((status) => (
                            <DropdownMenuItem
                              key={status.name}
                              onClick={() => {
                                updateStatus(status);
                              }}
                              className="px-1 border-1 border"
                              style={{
                                backgroundColor:
                                  STATUS_COLORS[status.variant].color,
                                color: STATUS_COLORS[status.variant].textColor,
                              }}
                            >
                              <span
                                className="text-sm flex items-center justify-center px-2 rounded-full"
                                style={{
                                  backgroundColor:
                                    STATUS_COLORS[status.variant].color,
                                  color:
                                    STATUS_COLORS[status.variant].textColor,
                                }}
                              >
                                {status.name}
                              </span>
                            </DropdownMenuItem>
                          ))}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {todo.status.name !== UNRESOLVED_STATUS.name &&
                    todo.status.continueFlow !== false && (
                      <StatusIconWithText
                        icon={CheckIcon}
                        text={todo.status.name}
                        color={STATUS_COLORS[todo.status.variant].color}
                        textColor={STATUS_COLORS[todo.status.variant].textColor}
                      />
                    )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {formatUtils.formatDateToAgo(new Date(todo.created))}
                </span>
              </div>
            </div>
          </RightDrawerHeader>

          <Separator className="mt-4 mb-6" />

          <ScrollArea className="flex-grow pr-4">
            <ApMarkdown
              markdown={todo.description ?? ''}
              variant={MarkdownVariant.BORDERLESS}
            />
            {edition !== ApEdition.COMMUNITY && (
              <div className="flex flex-col gap-4">
                <Separator className="mt-4" />
                <Comments task={todo} />
              </div>
            )}
          </ScrollArea>

          {/* Comment box is hidden as todo comments is an EE feature */}
          <div className="relative w-full py-5" hidden>
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
              className="absolute bottom-5 right-0"
              disabled={inputMessage.length === 0}
              onClick={() => {
                createComment(inputMessage);
                setInputMessage('');
              }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </RightDrawerContent>
    </RightDrawer>
  );
}

export { TodoDetails };
