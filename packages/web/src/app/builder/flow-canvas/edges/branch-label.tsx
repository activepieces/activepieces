import {
  FlowActionType,
  BranchExecutionType,
  FlowOperationType,
  flowStructureUtil,
  isNil,
  StepLocationRelativeToParent,
} from '@activepieces/shared';
import { useReactFlow } from '@xyflow/react';
import { t } from 'i18next';
import { CopyPlus, EllipsisVertical, Trash2 } from 'lucide-react';
import { useState } from 'react';

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
  ] = useBuilderStateContext((state) => [
    state.selectedStep,
    state.selectedBranchIndex,
    state.selectStepByName,
    state.setSelectedBranchIndex,
    flowStructureUtil.getStep(props.sourceNodeName, state.flowVersion.trigger),
    state.applyOperation,
    state.readonly,
  ]);

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
    step?.type === FlowActionType.ROUTER &&
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
  if (isInsideRouterBranch && step.type !== FlowActionType.ROUTER) {
    return <></>;
  }

  return (
    <div
      className="h-full flex items-center justify-center "
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDropdownMenuOpen(true);
      }}
    >
      <div
        className="bg-builder-background"
        style={{
          paddingTop: flowCanvasConsts.LABEL_VERTICAL_PADDING / 2 + 'px',
          paddingBottom: flowCanvasConsts.LABEL_VERTICAL_PADDING / 2 + 'px',
        }}
      >
        <div
          className={cn(
            'flex items-center justify-center gap-0.5 select-none transition-all rounded-md  text-sm border  border-solid bg-primary-100/30 dark:bg-primary-100/15  border-primary/50   px-2 text-primary/80 dark:text-primary/90   hover:text-primary hover:border-primary',
            {
              'border-primary text-primary': isBranchSelected,
              'bg-border/60 text-foreground/70 dark:text-foreground/70  border-border hover:text-foreground/70 hover:bg-border/60 hover:border-border cursor-default':
                isOtherwiseBranch,
              'text-success-800 bg-success-50 border-success-200 dark:text-success-200 dark:bg-success-900 dark:border-success-800 hover:text-success-800 hover:bg-success-50 hover:border-success-200 cursor-default':
                isOnSuccessBranch,
              'text-destructive-800 bg-destructive-50 border-destructive-200 dark:text-destructive-200 dark:bg-destructive-900 dark:border-destructive-800 hover:text-destructive-800 hover:bg-destructive-50 hover:border-destructive-200 cursor-default':
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
            step.type === FlowActionType.ROUTER && (
              <DropdownMenu
                modal={true}
                open={isDropdownMenuOpen}
                onOpenChange={setIsDropdownMenuOpen}
              >
                <DropdownMenuTrigger asChild>
                  <div
                    className="h-5 shrink-0 border border-transparent hover:border-solid hover:border-primary-300/50 transition-all rounded-full w-5 flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <EllipsisVertical className="h-4 w-4" />
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
                      <CopyPlus className="h-4 w-4" />
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
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span className="text-destructive">
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
