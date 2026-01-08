import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { useReactFlow } from '@xyflow/react';
import { t } from 'i18next';
import { CopyPlus, EllipsisVertical, Trash2 } from 'lucide-react';
import { useState } from 'react';

import {
  FlowActionType,
  BranchExecutionType,
  FlowOperationType,
  flowStructureUtil,
  isNil,
  StepLocationRelativeToParent,
} from '@activepieces/shared';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../../../../components/ui/dropdown-menu';
import { cn } from '../../../../lib/utils';
import { useBuilderStateContext } from '../../builder-hooks';
import { flowCanvasConsts } from '../utils/consts';
import { flowCanvasUtils } from '../utils/flow-canvas-utils';

type BaseBranchLabel = {
  label: string;
  targetNodeName: string;
  sourceNodeName: string;
  stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BRANCH;
  branchIndex: number;
};

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

  const isFallbackBranch =
    props.stepLocationRelativeToParent ===
      StepLocationRelativeToParent.INSIDE_BRANCH &&
    step?.type === FlowActionType.ROUTER &&
    step?.settings.branches[props.branchIndex]?.branchType ===
      BranchExecutionType.FALLBACK;
  const isNotInsideRoute =
    props.stepLocationRelativeToParent !==
    StepLocationRelativeToParent.INSIDE_BRANCH;
  const isOtherwiseBranch = isNotInsideRoute || isFallbackBranch;
  const isBranchSelected =
    selectedStep === props.sourceNodeName &&
    props.stepLocationRelativeToParent ===
      StepLocationRelativeToParent.INSIDE_BRANCH &&
    props.branchIndex === selectedBranchIndex;
  const { fitView } = useReactFlow();
  const [isDropdownMenuOpen, setIsDropdownMenuOpen] = useState(false);

  if (isNil(step) || step.type !== FlowActionType.ROUTER) {
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
            },
          )}
          style={{
            height: flowCanvasConsts.LABEL_HEIGHT + 'px',
            maxWidth: flowCanvasConsts.AP_NODE_SIZE.STEP.width - 10 + 'px',
          }}
          onClick={() => {
            if (
              props.stepLocationRelativeToParent ===
                StepLocationRelativeToParent.INSIDE_BRANCH &&
              !isOtherwiseBranch
            ) {
              selectStepByName(props.sourceNodeName);
              setSelectedBranchIndex(props.branchIndex);
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
                      applyOperation({
                        type: FlowOperationType.DUPLICATE_BRANCH,
                        request: {
                          stepName: props.sourceNodeName,
                          branchIndex: props.branchIndex,
                        },
                      });
                      setSelectedBranchIndex(props.branchIndex + 1);
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
                      setSelectedBranchIndex(null);
                      applyOperation({
                        type: FlowOperationType.DELETE_BRANCH,
                        request: {
                          stepName: props.sourceNodeName,
                          branchIndex: props.branchIndex,
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
