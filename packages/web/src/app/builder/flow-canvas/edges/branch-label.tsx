import { isNil } from '@activepieces/core-utils';
import {
  BranchExecutionType,
  FlowOperationType,
  flowStructureUtil,
  StepLocationRelativeToParent,
} from '@activepieces/shared';
import {
  CopyPlusIcon,
  Delete02Icon,
  MoreVerticalIcon,
} from '@hugeicons/core-free-icons';
import { useReactFlow } from '@xyflow/react';
import { t } from 'i18next';
import { useState } from 'react';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu';
import { cn } from '../../../../lib/utils';
import { useBuilderStateContext } from '../../builder-hooks';
import { flowCanvasConsts } from '../utils/consts';
import { flowCanvasUtils } from '../utils/flow-canvas-utils';

type BaseBranchLabel = {
  label: string;
  targetNodeName: string;
  sourceNodeName: string;
} & (
  | {
      stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BRANCH;
      branchIndex: number;
    }
  | {
      stepLocationRelativeToParent:
        | StepLocationRelativeToParent.INSIDE_ON_SUCCESS_BRANCH
        | StepLocationRelativeToParent.INSIDE_ON_FAILURE_BRANCH;
    }
);

const BranchLabel = (props: BaseBranchLabel) => {
  const [
    selectedStep,
    selectedBranchIndex,
    selectStepByName,
    setSelectedBranchIndex,
    step,
    applyOperation,
    readonly,
    canvasOrientation,
  ] = useBuilderStateContext((state) => [
    state.selectedStep,
    state.selectedBranchIndex,
    state.selectStepByName,
    state.setSelectedBranchIndex,
    flowStructureUtil.getStep(props.sourceNodeName, state.flowVersion.trigger),
    state.applyOperation,
    state.readonly,
    state.canvasOrientation,
  ]);
  const isHorizontal = canvasOrientation === 'horizontal';

  const isOnSuccessBranch =
    props.stepLocationRelativeToParent ===
    StepLocationRelativeToParent.INSIDE_ON_SUCCESS_BRANCH;
  const isOnFailureBranch =
    props.stepLocationRelativeToParent ===
    StepLocationRelativeToParent.INSIDE_ON_FAILURE_BRANCH;
  const isCofBranch = isOnSuccessBranch || isOnFailureBranch;
  const branchIndex =
    props.stepLocationRelativeToParent ===
    StepLocationRelativeToParent.INSIDE_BRANCH
      ? props.branchIndex
      : null;
  const isInsideRouterBranch = branchIndex !== null;
  const isFallbackBranch =
    isInsideRouterBranch &&
    !isNil(step) &&
    flowStructureUtil.isBranchedAction(step) &&
    step?.settings.branches[branchIndex]?.branchType ===
      BranchExecutionType.FALLBACK;
  const isOtherwiseBranch =
    (!isInsideRouterBranch && !isCofBranch) || isFallbackBranch;
  const isBranchSelected =
    selectedStep === props.sourceNodeName &&
    isInsideRouterBranch &&
    branchIndex === selectedBranchIndex;
  const { fitView } = useReactFlow();
  const [isDropdownMenuOpen, setIsDropdownMenuOpen] = useState(false);

  if (isNil(step)) {
    return <></>;
  }
  if (isInsideRouterBranch && !flowStructureUtil.isBranchedAction(step)) {
    return <></>;
  }

  return (
    <div
      className={cn('h-full flex items-center', {
        'justify-center': !isHorizontal,
        'justify-end': isHorizontal,
      })}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDropdownMenuOpen(true);
      }}
    >
      <div
        className="bg-gray-2 pointer-events-auto"
        style={{
          paddingTop: flowCanvasConsts.LABEL_VERTICAL_PADDING / 2 + 'px',
          paddingBottom: flowCanvasConsts.LABEL_VERTICAL_PADDING / 2 + 'px',
        }}
      >
        <div
          className={cn(
            'flex items-center justify-center gap-0.5 select-none transition-all rounded-md  text-sm border  border-solid bg-accent-3 border-accent-7 px-2 text-accent-11   hover:text-accent-11 hover:border-accent-9',
            {
              'border-accent-9 text-accent-11': isBranchSelected,
              'bg-gray-3 text-gray-11 border-gray-7 hover:text-gray-11 hover:bg-gray-3 hover:border-gray-7 cursor-default':
                isOtherwiseBranch,
              'text-success-11 bg-success-3 border-success-7 hover:text-success-11 hover:bg-success-3 hover:border-success-7 cursor-default':
                isOnSuccessBranch,
              'text-danger-11 bg-danger-3 border-danger-7 hover:text-danger-11 hover:bg-danger-3 hover:border-danger-7 cursor-default':
                isOnFailureBranch,
            },
          )}
          style={{
            height: flowCanvasConsts.LABEL_HEIGHT + 'px',
            maxWidth: flowCanvasConsts.AP_NODE_SIZE.STEP.width - 10 + 'px',
          }}
          onClick={() => {
            if (branchIndex !== null && !isOtherwiseBranch) {
              selectStepByName(props.sourceNodeName);
              setSelectedBranchIndex(branchIndex);
              fitView(
                flowCanvasUtils.createFocusStepInGraphParams(
                  props.targetNodeName,
                ),
              );
            }
          }}
        >
          <div className="truncate">
            {props.label === 'Otherwise' ? t('Otherwise') : props.label}
          </div>

          {!isOtherwiseBranch &&
            !readonly &&
            flowStructureUtil.isBranchedAction(step) && (
              <DropdownMenu
                modal={true}
                open={isDropdownMenuOpen}
                onOpenChange={setIsDropdownMenuOpen}
              >
                <DropdownMenuTrigger asChild>
                  <div
                    className="h-5 shrink-0 border border-transparent hover:border-solid hover:border-accent-7 transition-all rounded-full w-5 flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <HugeiconsIcon
                      icon={MoreVerticalIcon}
                      className="h-4 w-4"
                    />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (branchIndex === null) return;
                      applyOperation({
                        type: FlowOperationType.DUPLICATE_BRANCH,
                        request: {
                          stepName: props.sourceNodeName,
                          branchIndex,
                        },
                      });
                      setSelectedBranchIndex(branchIndex + 1);
                    }}
                  >
                    <div className="flex cursor-pointer  flex-row gap-2 items-center">
                      <HugeiconsIcon icon={CopyPlusIcon} className="h-4 w-4" />
                      <span>{t('Duplicate Branch')}</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={step.settings.branches.length <= 2}
                    onSelect={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (branchIndex === null) return;
                      setSelectedBranchIndex(null);
                      applyOperation({
                        type: FlowOperationType.DELETE_BRANCH,
                        request: {
                          stepName: props.sourceNodeName,
                          branchIndex,
                        },
                      });
                      selectStepByName(props.sourceNodeName);
                    }}
                  >
                    <div className="flex cursor-pointer  flex-row gap-2 items-center">
                      <HugeiconsIcon
                        icon={Delete02Icon}
                        className="h-4 w-4 text-danger-11"
                      />
                      <span className="text-danger-11">
                        {t('Delete Branch')}
                      </span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
        </div>
      </div>
    </div>
  );
};

export { BranchLabel };
