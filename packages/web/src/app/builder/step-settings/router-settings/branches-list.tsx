import { isNil } from '@activepieces/core-utils';
import { BranchedAction, BranchExecutionType } from '@activepieces/shared';
import {
  AlertCircleIcon,
  CopyPlusIcon,
  Delete02Icon,
  DragDropVerticalIcon,
  PencilEdit01Icon,
} from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import EditableText from '@/components/custom/editable-text';
import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { Button } from '@/components/ui/button';
import {
  Sortable,
  SortableDragHandle,
  SortableItem,
} from '@/components/ui/sortable';

import { Separator } from '../../../../components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../../../components/ui/tooltip';
import { cn } from '../../../../lib/utils';

type BranchListProps = {
  step: BranchedAction;
  showFallbackBranch?: boolean;
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
  showFallbackBranch = false,
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
  const form = useFormContext<BranchedAction>();
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
      {showFallbackBranch &&
        step.settings.branches.map((branch, index) =>
          branch.branchType === BranchExecutionType.FALLBACK ? (
            <div key={`fallback-${index}`}>
              <Separator></Separator>
              <BranchListItem
                branch={branch}
                branchIndex={index}
                readonly={readonly}
                onClick={() => {
                  setSelectedBranchIndex(index);
                }}
                errors={errors}
                duplicateBranch={() => undefined}
                deleteBranch={() => undefined}
                isEditingBranchName={branchNameEditingIndex === index}
                setIsEditingBranchName={(isEditing) =>
                  isEditing
                    ? setBranchNameEditingIndex(index)
                    : setBranchNameEditingIndex(null)
                }
                branchNameChanged={(name) => {
                  branchNameChanged(index, name);
                }}
                showDeleteButton={false}
                showDuplicateButton={false}
                showDragHandle={false}
              ></BranchListItem>
            </div>
          ) : null,
        )}
    </Sortable>
  );
};

type BranchListItemProps = {
  branch: { branchName: string };
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
  showDuplicateButton?: boolean;
  showDragHandle?: boolean;
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
  showDuplicateButton = true,
  showDragHandle = true,
}: BranchListItemProps) => {
  return (
    <div
      className={
        'flex items-center gap-2 hover:transition-colors   has-[div.button-group:hover]:bg-gray-1  text-sm hover:bg-gray-4 px-2 cursor-pointer'
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
              <HugeiconsIcon
                icon={AlertCircleIcon}
                className="h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400"
              />
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {t('Incomplete settings')}
            </TooltipContent>
          </Tooltip>
        </div>
      )}
      <div className="grow"></div>
      <div
        className={cn('flex gap-2 py-1 items-center button-group', {
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
                <HugeiconsIcon
                  icon={Delete02Icon}
                  className="size-4 text-danger-11"
                />
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
              <HugeiconsIcon icon={PencilEdit01Icon} className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t('Rename')}</TooltipContent>
        </Tooltip>

        {showDuplicateButton && (
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
                <HugeiconsIcon icon={CopyPlusIcon} className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t('Duplicate')}</TooltipContent>
          </Tooltip>
        )}
        {showDragHandle && (
          <Tooltip>
            <TooltipTrigger asChild>
              <SortableDragHandle
                variant="ghost"
                size="icon"
                disabled={readonly}
                className={'shrink-0 size-7'}
              >
                <HugeiconsIcon
                  icon={DragDropVerticalIcon}
                  className="size-4"
                  aria-hidden="true"
                />
              </SortableDragHandle>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t('Move')}</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
};
