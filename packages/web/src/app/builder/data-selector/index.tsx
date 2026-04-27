import {
  FlowAction,
  FlowActionType,
  FlowTrigger,
  FlowTriggerType,
  flowStructureUtil,
  isNil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { SearchXIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { textMentionUtils } from '@/app/builder/piece-properties/text-input-with-mentions/text-input-utils';
import { SearchInput } from '@/components/custom/search-input';
import { OutputDisplayHints } from '@/components/custom/smart-output-viewer/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { piecesApi } from '@/features/pieces';
import { cn } from '@/lib/utils';

import { ScrollArea } from '../../../components/ui/scroll-area';
import { BuilderState, useBuilderStateContext } from '../builder-hooks';

import {
  DataSelectorSizeState,
  DataSelectorSizeTogglers,
} from './data-selector-size-togglers';
import { FriendlyDataSelectorNode } from './friendly-data-selector-node';
import { DataSelectorTreeNode } from './type';
import { dataSelectorUtils } from './utils';

type StepInfo = (FlowAction | FlowTrigger) & { dfsIndex: number };

function getStepsAndData(state: BuilderState): {
  steps: StepInfo[];
  sampleData: Record<string, unknown>;
  isFocusInsideListMapperModeInput: boolean;
} {
  const { selectedStep, flowVersion } = state;
  if (!selectedStep || !flowVersion || !flowVersion.trigger) {
    return {
      steps: [],
      sampleData: {},
      isFocusInsideListMapperModeInput: false,
    };
  }
  const pathToTargetStep = flowStructureUtil.findPathToStep(
    flowVersion.trigger,
    selectedStep,
  );
  return {
    steps: pathToTargetStep,
    sampleData: state.outputSampleData,
    isFocusInsideListMapperModeInput: state.isFocusInsideListMapperModeInput,
  };
}

function buildAdvancedStructure(
  steps: StepInfo[],
  sampleData: Record<string, unknown>,
  isFocusInsideListMapperModeInput: boolean,
): DataSelectorTreeNode[] {
  return steps.map((step) => {
    try {
      return dataSelectorUtils.traverseStep(
        step,
        sampleData,
        isFocusInsideListMapperModeInput,
      );
    } catch {
      return {
        key: `error-${step.name}`,
        data: {
          type: 'chunk' as const,
          displayName: `Error loading ${step.name}`,
        },
      };
    }
  });
}

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
    return doesElementHaveAnInputThatUsesMentions(parent);
  }
  return false;
};

const DataSelector = ({ parentHeight, parentWidth }: DataSelectorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sizeState, setSizeState] = useState<DataSelectorSizeState>(
    DataSelectorSizeState.DOCKED,
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'friendly' | 'advanced'>('friendly');
  const [hintsMap, setHintsMap] = useState<
    Record<string, OutputDisplayHints | null>
  >({});
  const [showDataSelector, setShowDataSelector] = useState(false);

  const { steps, sampleData, isFocusInsideListMapperModeInput } =
    useBuilderStateContext(getStepsAndData);

  const advancedStructure = buildAdvancedStructure(
    steps,
    sampleData,
    isFocusInsideListMapperModeInput,
  );

  useEffect(() => {
    let cancelled = false;
    const fetchHints = async () => {
      const newHintsMap: Record<string, OutputDisplayHints | null> = {};
      const pairs = steps
        .map((step) => {
          if (step.type === FlowActionType.PIECE) {
            return {
              step,
              pieceName: step.settings.pieceName,
              stepKey: step.settings.actionName,
            };
          }
          if (step.type === FlowTriggerType.PIECE) {
            return {
              step,
              pieceName: step.settings.pieceName,
              stepKey: step.settings.triggerName,
            };
          }
          return { step, pieceName: undefined, stepKey: undefined };
        })
        .filter(
          (
            entry,
          ): entry is typeof entry & { pieceName: string; stepKey: string } =>
            Boolean(entry.pieceName) && Boolean(entry.stepKey),
        );

      const results = await Promise.all(
        pairs.map(async ({ pieceName, stepKey }) => {
          try {
            const piece = await piecesApi.get({ name: pieceName });
            return (
              piece.triggers?.[stepKey]?.outputDisplayHints ??
              piece.actions?.[stepKey]?.outputDisplayHints ??
              null
            );
          } catch {
            return null;
          }
        }),
      );

      pairs.forEach(({ step }, idx) => {
        newHintsMap[step.name] = results[idx];
      });

      if (!cancelled) {
        setHintsMap(newHintsMap);
      }
    };
    fetchHints();
    return () => {
      cancelled = true;
    };
  }, [steps, sampleData]);

  const friendlyStructure = steps.map((step) => {
    const displayName = `${step.dfsIndex + 1}. ${step.displayName}`;
    const stepData = sampleData[step.name];

    if (
      typeof stepData === 'string' ||
      typeof stepData === 'number' ||
      typeof stepData === 'boolean'
    ) {
      return {
        key: step.name,
        data: {
          type: 'value' as const,
          value: '',
          displayName,
          propertyPath: step.name,
          insertable: false,
        },
        children: [
          {
            key: `${step.name}_value`,
            data: {
              type: 'value' as const,
              value: stepData,
              displayName: t('Result'),
              propertyPath: step.name,
              insertable: true,
            },
          },
        ],
      };
    }

    if (Array.isArray(stepData) && stepData.length > 0) {
      return dataSelectorUtils.buildTreeFromArray({
        stepName: step.name,
        displayName,
        items: stepData,
      });
    }

    const hints = hintsMap[step.name];
    if (hints) {
      return dataSelectorUtils.buildTreeFromHints({
        stepName: step.name,
        displayName,
        hints,
        sampleData: stepData,
      });
    }
    try {
      return dataSelectorUtils.traverseStep(
        step,
        sampleData,
        isFocusInsideListMapperModeInput,
      );
    } catch {
      return {
        key: `error-${step.name}`,
        data: {
          type: 'chunk' as const,
          displayName: `Error loading ${step.name}`,
        },
      };
    }
  });

  const currentStructure =
    viewMode === 'friendly' ? friendlyStructure : advancedStructure;
  const filteredNodes = dataSelectorUtils.filterBy(
    currentStructure,
    searchTerm,
  );

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

  const contentHeight =
    sizeState === DataSelectorSizeState.COLLAPSED
      ? '0px'
      : sizeState === DataSelectorSizeState.DOCKED
      ? '450px'
      : `${parentHeight - 100}px`;

  const contentWidth =
    sizeState !== DataSelectorSizeState.EXPANDED
      ? '450px'
      : `${parentWidth - 40}px`;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={cn(
        'absolute bottom-0 mr-5 mb-5 right-0 z-50 transition-all border border-solid border-outline overflow-x-hidden bg-background shadow-lg rounded-md',
        {
          'opacity-0 pointer-events-none': !showDataSelector,
        },
        textMentionUtils.dataSelectorCssClassSelector,
      )}
    >
      <div className="flex items-center justify-between px-4 pt-1 pb-1">
        <span className="text-sm font-semibold">{t('Data Selector')}</span>
        <div className="flex items-center gap-0">
          <DataSelectorSizeTogglers
            state={sizeState}
            setListSizeState={setSizeState}
          />
        </div>
      </div>

      <div
        style={{ height: contentHeight, width: contentWidth }}
        className="transition-all overflow-hidden"
      >
        <div className="flex items-center gap-2 px-4 pb-2">
          <SearchInput onChange={(e) => setSearchTerm(e)} value={searchTerm} />
          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as 'friendly' | 'advanced')}
          >
            <TabsList className="h-9 shrink-0">
              <TabsTrigger value="friendly" className="text-xs px-2.5 h-7">
                {t('Friendly View')}
              </TabsTrigger>
              <TabsTrigger value="advanced" className="text-xs px-2.5 h-7">
                {t('Advanced')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className="transition-all h-[calc(100%-52px)] w-full [mask-image:linear-gradient(to_bottom,transparent_0px,black_8px)]">
          {filteredNodes.map((node) => (
            <FriendlyDataSelectorNode
              key={node.key}
              node={node}
              searchTerm={searchTerm}
            />
          ))}
          {filteredNodes.length === 0 && (
            <div className="flex items-center justify-center gap-2 mt-8 flex-col">
              <SearchXIcon className="w-8 h-8 text-muted-foreground" />
              <div className="text-center font-medium text-sm">
                {t('No matching data')}
              </div>
              <div className="text-center text-sm text-muted-foreground">
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
