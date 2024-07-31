import { flowHelper, isNil } from '@activepieces/shared';
import { useState } from 'react';

import { ScrollArea } from '../../../components/ui/scroll-area';
import {
  dataSelectorUtils,
  MentionTreeNode,
} from '../../../lib/data-selector-utils';
import { BuilderState, useBuilderStateContext } from '../builder-hooks';

import { DataSelectorNode } from './data-selector-node';
import {
  DataSelectorSizeState,
  DataSelectorSizeTogglers,
} from './data-selector-size-togglers';

import { cn } from '@/lib/utils';

const getAllStepsMentions: (state: BuilderState) => MentionTreeNode[] = (
  state,
) => {
  const { selectedStep, flowVersion } = state;
  if (!selectedStep || !flowVersion || !flowVersion.trigger) {
    return [];
  }
  const targetStep = flowHelper.getStep(flowVersion, selectedStep.stepName);
  if (!targetStep) {
    return [];
  }
  const pathToTargetStep = flowHelper.findPathToStep({
    targetStep,
    trigger: flowVersion.trigger,
  });

  return pathToTargetStep.map((step) => {
    const stepNeedsTesting = isNil(
      step.settings.inputUiInfo?.currentSelectedData,
    );
    const displayName = `${step.dfsIndex}. ${step.displayName}`;
    if (stepNeedsTesting) {
      return {
        key: step.name,
        data: {
          displayName,
          propertyPath: step.name,
          isTestStepNode: false,
          isSlice: false,
        },
        children: [
          {
            data: {
              displayName: displayName,
              propertyPath: step.name,
              isTestStepNode: true,
              isSlice: false,
            },
            key: `test_${step.name}`,
          },
        ],
      };
    }
    const stepMentionNode: MentionTreeNode =
      dataSelectorUtils.traverseStepOutputAndReturnMentionTree({
        stepOutput: step.settings.inputUiInfo?.currentSelectedData,
        propertyPath: step.name,
        displayName: step.displayName,
      });

    return {
      ...stepMentionNode,
      data: {
        ...stepMentionNode.data,
        displayName,
      },
    };
  });
};

const DataSelector = () => {
  const [DataSelectorSize, setDataSelectorSize] =
    useState<DataSelectorSizeState>(DataSelectorSizeState.DOCKED);

  const nodes = useBuilderStateContext(getAllStepsMentions);
  return (
    <div
      className={cn(
        'absolute bottom-[20px]  right-[20px] z-50 transition-all  border border-solid border-outline overflow-x-hidden bg-background shadow-lg rounded-md',
        {
          'h-[calc(100%-40px)] max-w-[500px]  w-[500px] max-h-[calc(100%-40px)] w-[calc(100%-40px)] max-w-[calc(100%-40px)]':
            DataSelectorSize === DataSelectorSizeState.EXPANDED,
          'w-[500px] max-w-[500px]':
            DataSelectorSize === DataSelectorSizeState.COLLAPSED,
          'opacity-0  pointer-events-none': nodes.length === 0,
          'opacity-100': nodes.length > 0,
        },
      )}
    >
      <div className="text-lg items-center font-semibold px-5 py-2 flex gap-2">
        Data Selector <div className="flex-grow"></div>{' '}
        <DataSelectorSizeTogglers
          state={DataSelectorSize}
          setListSizeState={setDataSelectorSize}
        ></DataSelectorSizeTogglers>
      </div>
      <ScrollArea
        className={cn('transition-all', {
          'h-[calc(100%-100px)] max-h-[calc(100%-100px)]':
            DataSelectorSize === DataSelectorSizeState.EXPANDED,
          'h-[450px] max-h-[450px]  max-w-[450px]  w-[450px]':
            DataSelectorSize === DataSelectorSizeState.DOCKED,
          'h-[0px]': DataSelectorSize === DataSelectorSizeState.COLLAPSED,
        })}
      >
        {nodes &&
          nodes.map((node) => (
            <DataSelectorNode
              depth={0}
              key={node.key}
              node={node}
            ></DataSelectorNode>
          ))}
      </ScrollArea>
    </div>
  );
};

DataSelector.displayName = 'DataSelector';
export { DataSelector };
