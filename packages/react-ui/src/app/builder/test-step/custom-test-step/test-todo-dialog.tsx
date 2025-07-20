import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { UserRoundPen, Clock2, ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ApMarkdown } from '@/components/custom/markdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { sampleDataApi } from '@/features/flows/lib/sample-data-api';
import { todosApi } from '@/features/todos/lib/todos-api';
import { userHooks } from '@/hooks/user-hooks';
import { formatUtils } from '@/lib/utils';
import {
  STATUS_COLORS,
  UNRESOLVED_STATUS,
  StatusOption,
  MarkdownVariant,
  StepRunResponse,
  isNil,
  FileType,
  FlowOperationType,
  TodoWithAssignee,
  TodoType,
  Action,
} from '@activepieces/shared';

import { useBuilderStateContext } from '../../builder-hooks';

type TodoTestingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todo: TodoWithAssignee;
  flowVersionId: string;
  projectId: string;
  currentStep: Action;
  type: TodoType;
  setErrorMessage: (errorMessage: string | undefined) => void;
};

function TodoTestingDialog({
  open,
  onOpenChange,
  todo,
  flowVersionId,
  projectId,
  currentStep,
  type,
  setErrorMessage,
}: TodoTestingDialogProps) {
  const { data: currentUser } = userHooks.useCurrentUser();
  const [status, setStatus] = useState<StatusOption>(todo.status);
  const [dialogOpenTime, setDialogOpenTime] = useState<Date | null>(null);
  const [, setForceUpdate] = useState(0);
  const [showMustResolveError, setShowMustResolveError] = useState(false);
  const { setSampleData, setSampleDataInput, applyOperation } =
    useBuilderStateContext((state) => {
      return {
        sampleDataInput: state.sampleDataInput[currentStep.name],
        setSampleData: state.setSampleData,
        setSampleDataInput: state.setSampleDataInput,
        applyOperation: state.applyOperation,
      };
    });
  const { mutate: resolveTodo, isPending: isResolvingTodo } = useMutation<
    StepRunResponse & {
      sampleDataFileId?: string;
      sampleDataInputFileId?: string;
    },
    Error,
    void
  >({
    mutationFn: async () => {
      const response = await todosApi.update(todo.id, {
        status: status,
        isTest: true,
      });
      let sampleDataFileId: string | undefined = undefined;
      if (!isNil(response)) {
        const sampleFile = await sampleDataApi.save({
          flowVersionId,
          stepName: currentStep.name,
          payload: {
            status: response.status.name,
          },
          projectId,
          fileType: FileType.SAMPLE_DATA,
        });
        sampleDataFileId = sampleFile.id;
      }
      const sampleDataInputFile = await sampleDataApi.save({
        flowVersionId,
        stepName: currentStep.name,
        payload: currentStep.settings,
        projectId,
        fileType: FileType.SAMPLE_DATA_INPUT,
      });
      return {
        id: todo.id,
        input: currentStep.settings,
        success: true,
        output: response,
        standardError: '',
        standardOutput: '',
        sampleDataFileId,
        sampleDataInputFileId: sampleDataInputFile.id,
      };
    },
    onSuccess: ({
      success,
      input,
      output,
      sampleDataFileId,
      sampleDataInputFileId,
    }) => {
      if (success) {
        setErrorMessage(undefined);

        const newInputUiInfo: Action['settings']['inputUiInfo'] = {
          ...currentStep.settings.inputUiInfo,
          sampleDataFileId,
          sampleDataInputFileId,
          currentSelectedData: undefined,
          lastTestDate: dayjs().toISOString(),
        };
        const currentStepCopy: Action = JSON.parse(JSON.stringify(currentStep));
        currentStepCopy.settings.inputUiInfo = newInputUiInfo;
        applyOperation({
          type: FlowOperationType.UPDATE_ACTION,
          request: currentStepCopy,
        });
        const response = output as TodoWithAssignee;
        const statusName = response['status'].name;
        const statusOptions = response['statusOptions'];
        const publicUrl = response['resolveUrl']?.split('/flow-runs/')[0];
        const links = statusOptions.map((option) => ({
          status: option.name,
          url:
            publicUrl +
            `/todos/${response.id}/resolve?status=${option.name}&isTest=true`,
        }));
        switch (type) {
          case TodoType.INTERNAL:
            setSampleData(currentStep.name, {
              status: statusName,
            });
            break;
          case TodoType.EXTERNAL:
            setSampleData(currentStep.name, {
              id: response.id,
              links,
            });
            break;
        }
        setSampleDataInput(currentStep.name, input);
        onOpenChange(false);
      }
    },
    onError: (error) => {
      console.error(error);
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  useEffect(() => {
    if (open) {
      setDialogOpenTime(new Date());

      const intervalId = setInterval(() => {
        setForceUpdate((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(intervalId);
    }
  }, [open]);
  const isResolvedStatusSelected = status.name !== UNRESOLVED_STATUS.name;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-3xl">
        <DialogTitle className="flex items-center gap-2 mb-4">
          <span>Todo</span>
          <Badge variant="outline" className="text-xs">
            {t('Test Environment')}
          </Badge>
        </DialogTitle>
        <div className="flex flex-col w-full max-h-[calc(100vh-250px)] min-h-[20px]">
          <div className="flex flex-col gap-2">
            <span>{todo.title}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <UserRoundPen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {t('Assigned to')}
                </span>
                <span className="text-sm">
                  {todo.assignee && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-sm font-medium">
                          {todo.assignee.firstName} {todo.assignee.lastName}{' '}
                          {todo.assigneeId === currentUser?.id ? t('(Me)') : ''}
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
                <span className="text-sm text-muted-foreground mr-2">
                  Status
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button
                      className="h-8 px-2 flex gap-2 items-center justify-between border-1 border"
                      style={{
                        backgroundColor: STATUS_COLORS[status.variant].color,
                        color: STATUS_COLORS[status.variant].textColor,
                      }}
                    >
                      <>
                        <span className="text-sm flex items-center justify-center py-0.5 px-2 rounded-full">
                          {status.name}
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <div className="flex flex-col gap-1">
                      {todo.statusOptions.map((status) => (
                        <DropdownMenuItem
                          key={status.name}
                          onClick={() => {
                            setStatus(status);
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
                              color: STATUS_COLORS[status.variant].textColor,
                            }}
                          >
                            {status.name}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {dialogOpenTime
                  ? formatUtils.formatDateToAgo(dialogOpenTime)
                  : ''}
              </span>
            </div>
          </div>
          {showMustResolveError && !isResolvedStatusSelected && (
            <div className="text-red-500 text-sm  mt-2">
              {t('Please select status to resolve the todo')}
            </div>
          )}
          <Separator className="mt-4 mb-6" />

          <ScrollArea className="flex-grow pr-4">
            <ApMarkdown
              markdown={todo.description ?? ''}
              variant={MarkdownVariant.BORDERLESS}
            />
          </ScrollArea>
        </div>
        <DialogFooter className="justify-end">
          <DialogClose asChild>
            <Button variant="outline">{t('Cancel')}</Button>
          </DialogClose>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  loading={isResolvingTodo}
                  onClick={() => {
                    if (isResolvedStatusSelected) {
                      resolveTodo();
                    } else {
                      setShowMustResolveError(true);
                    }
                  }}
                >
                  {t('Resolve')}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('Change status to resolved')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { TodoTestingDialog };
