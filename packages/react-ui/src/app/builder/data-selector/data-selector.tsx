import { SearchXIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Action, flowHelper, isNil, Trigger } from '@activepieces/shared';

import { ScrollArea } from '../../../components/ui/scroll-area';
import { BuilderState, useBuilderStateContext } from '../builder-hooks';

import { DataSelectorNode } from './data-selector-node';
import {
  DataSelectorSizeState,
  DataSelectorSizeTogglers,
} from './data-selector-size-togglers';
import { dataSelectorUtils, MentionTreeNode } from './data-selector-utils';

const createTestNode = (
  step: Action | Trigger,
  displayName: string,
): MentionTreeNode => {
  return {
    key: step.name,
    data: {
      displayName,
      propertyPath: step.name,
    },
    children: [
      {
        data: {
          displayName: displayName,
          propertyPath: step.name,
          isTestStepNode: true,
        },
        key: `test_${step.name}`,
      },
    ],
  };
};

function useDataSelectorVisibility(
  containerRef: React.RefObject<HTMLDivElement>,
  setShowDataSelector: (showDataSelector: boolean) => void,
) {
  const checkFocus = useCallback(() => {
    if (
      (containerRef.current &&
        containerRef.current.contains(document.activeElement)) ||
      document.activeElement?.classList.contains('ap-text-with-mentions')
    ) {
      setShowDataSelector(true);
    } else {
      setShowDataSelector(false);
    }
  }, []);

  useEffect(() => {
    // Add event listeners for focus changes
    document.addEventListener('focusin', checkFocus);
    document.addEventListener('focusout', checkFocus);

    // Cleanup function
    return () => {
      document.removeEventListener('focusin', checkFocus);
      document.removeEventListener('focusout', checkFocus);
    };
  }, [checkFocus]);
}

function filterBy(arr: MentionTreeNode[], query: string): MentionTreeNode[] {
  return query
    ? arr.reduce((acc, item) => {
        if (item.children?.length) {
          const filtered = filterBy(item.children, query);
          if (filtered.length) return [...acc, { ...item, children: filtered }];
        }

        const { children, ...itemWithoutChildren } = item;
        return item.data.displayName
          ?.toLowerCase()
          .includes(query.toLowerCase())
          ? [...acc, itemWithoutChildren]
          : acc;
      }, [] as MentionTreeNode[])
    : arr;
}

const getAllStepsMentions: (state: BuilderState) => MentionTreeNode[] = (
  state,
) => {
  const { selectedStep, flowVersion } = state;
  if (!selectedStep || !flowVersion || !flowVersion.trigger) {
    return [];
  }
  const pathToTargetStep = flowHelper.findPathToStep({
    targetStepName: selectedStep.stepName,
    trigger: flowVersion.trigger,
  });

  return pathToTargetStep.map((step) => {
    const stepNeedsTesting = isNil(
      step.settings.inputUiInfo?.currentSelectedData,
    );
    const displayName = `${step.dfsIndex + 1}. ${step.displayName}`;
    if (stepNeedsTesting) {
      return createTestNode(step, displayName);
    }
    return dataSelectorUtils.traverseStepOutputAndReturnMentionTree({
      stepOutput: step.settings.inputUiInfo?.currentSelectedData,
      propertyPath: step.name,
      displayName: displayName,
    });
  });
};

type DataSelectorProps = {
  parentHeight: number;
  parentWidth: number;
};

const DataSelector = ({ parentHeight, parentWidth }: DataSelectorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [DataSelectorSize, setDataSelectorSize] =
    useState<DataSelectorSizeState>(DataSelectorSizeState.DOCKED);
  const [searchTerm, setSearchTerm] = useState('');
  const mentions = useBuilderStateContext(getAllStepsMentions);
  const filteredMentions = filterBy(mentions, searchTerm);
  const [showDataSelector, setShowDataSelector] = useState(false);
  useDataSelectorVisibility(containerRef, setShowDataSelector);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={cn(
        'absolute bottom-[0px]  mr-5 mb-5  right-[0px]  z-50 transition-all  border border-solid border-outline overflow-x-hidden bg-background shadow-lg rounded-md',
        {
          'opacity-0  pointer-events-none': !showDataSelector,
        },
      )}
    >
      <div className="text-lg pointer-events-auto items-center font-semibold px-5 py-2 flex gap-2">
        Data Selector <div className="flex-grow"></div>{' '}
        <DataSelectorSizeTogglers
          state={DataSelectorSize}
          setListSizeState={setDataSelectorSize}
        ></DataSelectorSizeTogglers>
      </div>
      <div
        style={{
          height:
            DataSelectorSize === DataSelectorSizeState.COLLAPSED
              ? '0px'
              : DataSelectorSize === DataSelectorSizeState.DOCKED
              ? '450px'
              : `${parentHeight - 100}px`,
          width:
            DataSelectorSize === DataSelectorSizeState.COLLAPSED
              ? '0px'
              : DataSelectorSize === DataSelectorSizeState.DOCKED
              ? '450px'
              : `${parentWidth - 40}px`,
        }}
        className="transition-all overflow-hidden"
      >
        <div className="flex items-center gap-2 px-5 py-2">
          <Input
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          ></Input>
        </div>

        <ScrollArea className="transition-all h-[calc(100%-56px)] w-full ">
          {filteredMentions &&
            filteredMentions.map((node) => (
              <DataSelectorNode
                depth={0}
                key={node.key}
                node={node}
                searchTerm={searchTerm}
              ></DataSelectorNode>
            ))}
          {filteredMentions.length === 0 && (
            <div className="flex items-center justify-center gap-2 mt-5  flex-col">
              <SearchXIcon className="w-[35px] h-[35px]"></SearchXIcon>
              <div className="text-center font-semibold text-md">
                No matching data
              </div>
              <div className="text-center ">Try adjusting your search</div>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

DataSelector.displayName = 'DataSelector';
export { DataSelector };
