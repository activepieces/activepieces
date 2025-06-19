import { DragHandleDots2Icon } from '@radix-ui/react-icons';
import { t } from 'i18next';
import { Trash, CopyPlus, Pencil } from 'lucide-react';
import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import {
  Sortable,
  SortableDragHandle,
  SortableItem,
} from '@/components/ui/sortable';
import {
  RouterAction,
  BranchExecutionType,
  isNil,
  RouterActionSettings,
} from '@activepieces/shared';

import { InvalidStepIcon } from '../../../../components/custom/alert-icon';
import { Button } from '../../../../components/ui/button';
import EditableText from '../../../../components/ui/editable-text';
import { Separator } from '../../../../components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../../../components/ui/tooltip';
import { cn } from '../../../../lib/utils';

type BranchListProps = {
  step: RouterAction;
  setSelectedBranchIndex: (index: number) => void;
  deleteBranch: (index: number) => void;
  duplicateBranch: (index: number) => void;
  errors: unknown[];
  readonly: boolean;
  branchNameChanged: (index: number, name: string) => void;
  moveBranch: ({
    sourceIndex,
    targetIndex,
  }: {
    sourceIndex: number;
    targetIndex: number;
  }) => void;
};
export const BranchesList = ({
  step,
  setSelectedBranchIndex,
  errors,
  duplicateBranch,
  deleteBranch,
  readonly,
  branchNameChanged,
  moveBranch,
}: BranchListProps) => {
  const [branchNameEditingIndex, setBranchNameEditingIndex] = useState<
    number | null
  >(null);
  const form = useFormContext<RouterAction>();
  return (
    <Sortable
      value={step.settings.branches.map((branch, idx) => ({
        id: idx + 1,
        branch,
      }))}
      onMove={({ activeIndex, overIndex }) => {
        moveBranch({ sourceIndex: activeIndex, targetIndex: overIndex });
      }}
    >
      {step.settings.branches.map((branch, index) =>
        branch.branchType === BranchExecutionType.FALLBACK ? (
          <React.Fragment key={index}></React.Fragment>
        ) : (
          <SortableItem key={index} value={index + 1} asChild>
            <div>
              <BranchListItem
                branch={branch}
                branchIndex={index}
                readonly={readonly}
                onClick={() => {
                  setSelectedBranchIndex(index);
                }}
                errors={errors}
                duplicateBranch={() => {
                  duplicateBranch(index);
                  form.trigger();
                }}
                deleteBranch={() => {
                  deleteBranch(index);
                  form.trigger();
                }}
                isEditingBranchName={branchNameEditingIndex === index}
                setIsEditingBranchName={(isEditing) =>
                  isEditing
                    ? setBranchNameEditingIndex(index)
                    : setBranchNameEditingIndex(null)
                }
                branchNameChanged={(name) => {
                  branchNameChanged(index, name);
                }}
                showDeleteButton={step.settings.branches.length > 2}
              ></BranchListItem>

              {index === step.settings.branches.length - 2 ? null : (
                <Separator></Separator>
              )}
            </div>
          </SortableItem>
        ),
      )}
    </Sortable>
  );
};

type BranchListItemProps = {
  branch: RouterActionSettings['branches'][number];
  branchIndex: number;
  readonly: boolean;
  onClick: () => void;
  errors: unknown[];
  duplicateBranch: () => void;
  deleteBranch: () => void;
  isEditingBranchName: boolean;
  setIsEditingBranchName: (isEditing: boolean) => void;
  branchNameChanged: (name: string) => void;
  showDeleteButton: boolean;
};

export const BranchListItem = ({
  branch,
  branchIndex,
  readonly,
  onClick,
  errors,
  duplicateBranch,
  deleteBranch,
  isEditingBranchName,
  setIsEditingBranchName,
  branchNameChanged,
  showDeleteButton,
}: BranchListItemProps) => {
  return (
    <div
      className={
        'flex items-center gap-2 hover:transition-colors   has-[div.button-group:hover]:bg-background  text-sm hover:bg-gray-100 dark:hover:bg-accent px-2 cursor-pointer'
      }
      onClick={() => {
        onClick();
      }}
    >
      <EditableText
        key={branch.branchName + branchIndex}
        readonly={readonly}
        value={branch.branchName}
        onValueChange={(value) => {
          if (value) {
            branchNameChanged(value);
          }
        }}
        isEditing={isEditingBranchName}
        setIsEditing={setIsEditingBranchName}
        disallowEditingOnClick={true}
      ></EditableText>

      {!isNil(errors[branchIndex]) && (
        <div className="min-w-[16px]">
          <Tooltip>
            <TooltipTrigger asChild>
              <InvalidStepIcon
                size={16}
                viewBox="0 0 16 16"
                className="stroke-0 animate-fade shrink-0"
              ></InvalidStepIcon>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {t('Incomplete settings')}
            </TooltipContent>
          </Tooltip>
        </div>
      )}
      <div className="grow"></div>
      <div
        className={cn('flex gap-2 py-3 items-center button-group', {
          'pointer-events-none': readonly,
          'opacity-0': readonly,
        })}
      >
        {showDeleteButton && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={'ghost'}
                size={'icon'}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteBranch();
                }}
              >
                <Trash className="w-4 h-4 stroke-destructive"></Trash>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t('Delete')}</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={'ghost'}
              size={'icon'}
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingBranchName(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t('Rename')}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={'ghost'}
              size={'icon'}
              onClick={(e) => {
                e.stopPropagation();
                duplicateBranch();
              }}
            >
              <CopyPlus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t('Duplicate')}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <SortableDragHandle
              variant="ghost"
              size="icon"
              disabled={readonly}
              className={'shrink-0 size-7'}
            >
              <DragHandleDots2Icon className="size-4" aria-hidden="true" />
            </SortableDragHandle>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t('Move')}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};
