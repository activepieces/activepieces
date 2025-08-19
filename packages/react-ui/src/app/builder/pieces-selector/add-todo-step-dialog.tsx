import { t } from 'i18next';
import { InfoIcon } from 'lucide-react';
import { useState } from 'react';

import ActivepiecesCreateTodoGuide from '@/assets/img/custom/ActivepiecesCreateTodoGuide.png';
import ActivepiecesTodo from '@/assets/img/custom/ActivepiecesTodo.png';
import ExternalChannelTodo from '@/assets/img/custom/External_Channel_Todo.png';
import { CardListItem } from '@/components/custom/card-list';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useNewWindow } from '@/lib/navigation-utils';
import { PieceSelectorOperation, PieceSelectorPieceItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { isNil, TodoType } from '@activepieces/shared';

import { useBuilderStateContext } from '../builder-hooks';

import {
  createRouterStep,
  createTodoStep,
  createWaitForApprovalStep,
} from './custom-piece-selector-items-utils';
import GenericActionOrTriggerItem from './generic-piece-selector-item';

type AddTodoStepDialogProps = {
  pieceSelectorItem: PieceSelectorPieceItem;
  operation: PieceSelectorOperation;
  hidePieceIconAndDescription: boolean;
};

const AddTodoStepDialog = ({
  operation,
  pieceSelectorItem,
  hidePieceIconAndDescription,
}: AddTodoStepDialogProps) => {
  const [todoType, setTodoType] = useState<TodoType>(TodoType.INTERNAL);
  const [hoveredTodoType, setHoveredTodoType] = useState<TodoType | null>(null);
  const [handleAddingOrUpdatingStep] = useBuilderStateContext((state) => [
    state.handleAddingOrUpdatingStep,
  ]);

  const handleAddCreateTodoAction = () => {
    const todoStepName = createTodoStep({
      pieceMetadata: pieceSelectorItem.pieceMetadata,
      operation,
      todoType,
      handleAddingOrUpdatingStep,
    });
    if (isNil(todoStepName)) {
      return;
    }
    switch (todoType) {
      case TodoType.INTERNAL: {
        createRouterStep({
          parentStepName: todoStepName,
          logoUrl: pieceSelectorItem.pieceMetadata.logoUrl,
          handleAddingOrUpdatingStep,
        });
        break;
      }
      case TodoType.EXTERNAL: {
        const waitForApprovalStepName = createWaitForApprovalStep({
          pieceMetadata: pieceSelectorItem.pieceMetadata,
          parentStepName: todoStepName,
          handleAddingOrUpdatingStep,
        });
        if (!waitForApprovalStepName) {
          return;
        }
        createRouterStep({
          parentStepName: waitForApprovalStepName,
          logoUrl: pieceSelectorItem.pieceMetadata.logoUrl,
          handleAddingOrUpdatingStep,
        });
        break;
      }
    }
  };
  const [open, setOpen] = useState(false);
  return (
    <>
      <GenericActionOrTriggerItem
        item={pieceSelectorItem}
        hidePieceIconAndDescription={hidePieceIconAndDescription}
        stepMetadataWithSuggestions={pieceSelectorItem.pieceMetadata}
        onClick={() => setOpen(true)}
      ></GenericActionOrTriggerItem>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-xl">{t('Create Todo')}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/2 space-y-6">
                <h3 className="text-lg font-medium">
                  {t('Where would you like the todo to be reviewed?')}
                </h3>
                <div className="space-y-4">
                  <TodoTypeOption
                    todoType={TodoType.INTERNAL}
                    setTodoType={setTodoType}
                    setHoveredOption={setHoveredTodoType}
                    selectedTodoType={todoType}
                  />
                  <TodoTypeOption
                    todoType={TodoType.EXTERNAL}
                    setTodoType={setTodoType}
                    setHoveredOption={setHoveredTodoType}
                    selectedTodoType={todoType}
                  />
                </div>
              </div>
              <div className="md:w-1/2 flex flex-col items-center justify-center">
                <PreviewImage todoType={hoveredTodoType || todoType} />
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 mt-3 pt-3">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="mr-2"
            >
              {t('Cancel')}
            </Button>
            <Button onClick={handleAddCreateTodoAction}>
              {t('Add Steps')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

AddTodoStepDialog.displayName = 'CreateTodoDialog';
export { AddTodoStepDialog as CreateTodoDialog };
const PreviewImage = ({ todoType }: { todoType: TodoType }) => {
  const image =
    todoType === TodoType.INTERNAL
      ? ActivepiecesCreateTodoGuide
      : ExternalChannelTodo;
  const alt =
    todoType === TodoType.INTERNAL ? 'Todos flow' : 'External channel flow';
  const title =
    todoType === TodoType.INTERNAL
      ? t('Preview (Activepieces Todos)')
      : t('Preview (External channel)');
  const description =
    todoType === TodoType.INTERNAL
      ? t('Users will manage tasks directly in our interface')
      : t(
          'Send notifications with approval links via external channels like Slack, Teams or Email. Best for collaborating with external stakeholders.',
        );
  return (
    <div className="overflow-hidden p-3 w-full h-full">
      <div className="flex flex-col items-center h-[480px]">
        <h3 className="text-md font-medium mb-3 text-center">{title}</h3>

        <div className="w-full h-[350px]  rounded mb-2 flex items-center justify-center bg-muted/50 relative">
          <img src={image} alt={alt} className="w-full h-full object-contain" />
          <div className="absolute -bottom-1 left-0 right-0 h-28 bg-gradient-to-t from-white dark:from-background to-transparent"></div>
        </div>

        <p className="text-sm text-muted-foreground italic text-center mb-2">
          {description}
        </p>
      </div>
    </div>
  );
};

const TodoTypeOption = ({
  todoType,
  setTodoType,
  setHoveredOption,
  selectedTodoType,
}: {
  todoType: TodoType;
  setTodoType: (todoType: TodoType) => void;
  setHoveredOption: (todoType: TodoType | null) => void;
  selectedTodoType: TodoType;
}) => {
  const selected = todoType === selectedTodoType;
  const title =
    todoType === TodoType.INTERNAL
      ? t('Internal Todos')
      : t('External Channel (Slack, Teams, Email, ...)');
  const description =
    todoType === TodoType.INTERNAL
      ? t('Users will manage tasks directly in our interface')
      : t(
          'Send notifications with approval links via external channels like Slack, Teams or Email. Best for collaborating with external stakeholders.',
        );
  const openNewWindow = useNewWindow();
  return (
    <CardListItem
      className={cn(
        `p-4 rounded-lg border  block hover:border-primary/50 hover:bg-muted/50`,
        selected && 'border-primary bg-primary/5',
      )}
      onClick={() => setTodoType(todoType)}
      interactive={true}
      onMouseEnter={() => setHoveredOption(todoType)}
      onMouseLeave={() => setHoveredOption(null)}
    >
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-md font-medium flex items-center gap-2">
          {title}
          {todoType === TodoType.INTERNAL && (
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <InfoIcon className="w-4 h-4" />
              </TooltipTrigger>
              <TooltipContent side="right" className="w-[550px]">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm select-none">
                      {t('Users will manage tasks directly in our interface')}
                    </span>{' '}
                    <span
                      className="text-sm text-primary underline cursor-pointer"
                      onClick={() => openNewWindow('/todos')}
                    >
                      {t('here')}
                    </span>
                  </div>

                  <div className="bg-muted rounded p-1">
                    <img
                      src={ActivepiecesTodo}
                      alt="Todo UI"
                      className="w-full h-auto rounded"
                    />
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </h4>
        <div className="flex-shrink-0 w-5 h-5">
          <div
            className={cn(
              `w-5 h-5 rounded-full grid place-items-center border border-muted-foreground`,
              selected && 'border-primary',
            )}
          >
            {selected && (
              <div className="w-3 h-3 rounded-full bg-primary"></div>
            )}
          </div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </CardListItem>
  );
};
