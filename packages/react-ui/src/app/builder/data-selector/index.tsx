import { t } from 'i18next';
import { SearchXIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { textMentionUtils } from '@/app/builder/piece-properties/text-input-with-mentions/text-input-utils';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { flowStructureUtil, isNil } from '@activepieces/shared';

import { ScrollArea } from '../../../components/ui/scroll-area';
import { BuilderState, useBuilderStateContext } from '../builder-hooks';

import { DataSelectorNode } from './data-selector-node';
import {
  DataSelectorSizeState,
  DataSelectorSizeTogglers,
} from './data-selector-size-togglers';
import { DataSelectorTreeNode } from './type';
import { dataSelectorUtils } from './utils';

const getDataSelectorStructure: (
  state: BuilderState,
) => DataSelectorTreeNode[] = (state) => {
  const { selectedStep, flowVersion } = state;
  if (!selectedStep || !flowVersion || !flowVersion.trigger) {
    return [];
  }
  const pathToTargetStep = flowStructureUtil.findPathToStep(
    flowVersion.trigger,
    selectedStep,
  );
  return pathToTargetStep.map((step) => {
    try {
      return dataSelectorUtils.traverseStep(
        step,
        state.sampleData,
        state.isFocusInsideListMapperModeInput,
      );
    } catch (error) {
      console.error('Failed to traverse step:', error);
      return {
        key: `error-${step.name}`,
        data: {
          type: 'chunk',
          displayName: `Error loading ${step.name}`,
        },
      };
    }
  });
};

type DataSelectorProps = {
  parentHeight: number;
  parentWidth: number;
};

const doesElementHaveAnInputThatUsesMentions = (
  element: Element | null,
): boolean => {
  if (isNil(element)) {
    return false;
  }
  if (element.classList.contains(textMentionUtils.inputWithMentionsCssClass)) {
    return true;
  }
  const parent = element.parentElement;
  if (parent) {
    return parent && doesElementHaveAnInputThatUsesMentions(parent);
  }
  return false;
};

const DataSelector = ({ parentHeight, parentWidth }: DataSelectorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [DataSelectorSize, setDataSelectorSize] =
    useState<DataSelectorSizeState>(DataSelectorSizeState.DOCKED);
  const [searchTerm, setSearchTerm] = useState('');
  const dataSelectorStructure = useBuilderStateContext(
    getDataSelectorStructure,
  );
  const filteredNodes = dataSelectorUtils.filterBy(
    dataSelectorStructure,
    searchTerm,
  );
  const [showDataSelector, setShowDataSelector] = useState(false);

  const checkFocus = useCallback(() => {
    const isTextMentionInputFocused =
      (!isNil(containerRef.current) &&
        containerRef.current.contains(document.activeElement)) ||
      doesElementHaveAnInputThatUsesMentions(document.activeElement);
    setShowDataSelector(isTextMentionInputFocused);
  }, []);

  useEffect(() => {
    document.addEventListener('focusin', checkFocus);
    document.addEventListener('focusout', checkFocus);

    return () => {
      document.removeEventListener('focusin', checkFocus);
      document.removeEventListener('focusout', checkFocus);
    };
  }, [checkFocus]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={cn(
        'absolute bottom-[0px]  mr-5 mb-5  right-[0px]  z-50 transition-all  border border-solid border-outline overflow-x-hidden bg-background shadow-lg rounded-md',
        {
          'opacity-0 pointer-events-none': !showDataSelector,
        },
        textMentionUtils.dataSelectorCssClassSelector,
      )}
    >
      <div className="text-lg items-center font-semibold px-5 py-2 flex gap-2">
        {t('Data Selector')} <div className="flex-grow"></div>{' '}
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
            DataSelectorSize !== DataSelectorSizeState.EXPANDED
              ? '450px'
              : `${parentWidth - 40}px`,
        }}
        className="transition-all overflow-hidden"
      >
        <div className="flex items-center gap-2 px-5 py-2">
          <Input
            placeholder={t('Search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          ></Input>
        </div>

        <ScrollArea className="transition-all h-[calc(100%-56px)] w-full ">
          {filteredNodes &&
            filteredNodes.map((node) => (
              <DataSelectorNode
                depth={0}
                key={node.key}
                node={node}
                searchTerm={searchTerm}
              ></DataSelectorNode>
            ))}
          {filteredNodes.length === 0 && (
            <div className="flex items-center justify-center gap-2 mt-5  flex-col">
              <SearchXIcon className="w-[35px] h-[35px]"></SearchXIcon>
              <div className="text-center font-semibold text-md">
                {t('No matching data')}
              </div>
              <div className="text-center ">
                {t('Try adjusting your search')}
              </div>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

DataSelector.displayName = 'DataSelector';
export { DataSelector };
