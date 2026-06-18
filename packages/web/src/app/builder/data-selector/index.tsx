import { PieceMetadataModel } from '@activepieces/pieces-framework';
import {
  FlowAction,
  FlowActionType,
  FlowTrigger,
  FlowTriggerType,
  LocalesEnum,
  flowStructureUtil,
  isNil,
} from '@activepieces/shared';
import { useQueries } from '@tanstack/react-query';
import { t } from 'i18next';
import { Database, SearchXIcon, Variable } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { textMentionUtils } from '@/app/builder/piece-properties/text-input-with-mentions/text-input-utils';
import { SearchInput } from '@/components/custom/search-input';
import { OutputSchema } from '@/components/custom/smart-output-viewer/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { piecesApi } from '@/features/pieces';
import { cn } from '@/lib/utils';

import { ScrollArea } from '../../../components/ui/scroll-area';
import { BuilderState, useBuilderStateContext } from '../builder-hooks';

import { DataSelectorNode } from './data-selector-node';
import {
  DataSelectorSizeState,
  DataSelectorSizeTogglers,
} from './data-selector-size-togglers';
import { pathHelpers } from './path-helpers';
import { DataSelectorTreeNode } from './type';
import { dataSelectorUtils } from './utils';
import { schemaTreeUtils } from './utils-schema';
import { VariablesTab } from './variables-tab';

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
  targetStepName: string,
): DataSelectorTreeNode[] {
  return steps.map((step) => {
    try {
      return dataSelectorUtils.traverseStep(
        step,
        sampleData,
        isFocusInsideListMapperModeInput,
        targetStepName,
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
  const { i18n } = useTranslation();
  const [dataSelectorSize, setDataSelectorSize] =
    useState<DataSelectorSizeState>(DataSelectorSizeState.DOCKED);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'friendly' | 'advanced'>('friendly');
  const [showDataSelector, setShowDataSelector] = useState(false);

  const { steps, sampleData, isFocusInsideListMapperModeInput } =
    useBuilderStateContext(getStepsAndData);
  const isTriggerSelected = useBuilderStateContext(
    (state) => state.selectedStep === 'trigger',
  );
  const selectedStepName = useBuilderStateContext(
    (state) => state.selectedStep ?? '',
  );
  const defaultTab = isTriggerSelected ? 'variables' : 'data';

  const piecePairs = useMemo(
    () =>
      steps
        .map((step) => {
          if (step.type === FlowActionType.PIECE) {
            return {
              stepName: step.name,
              pieceName: step.settings.pieceName,
              pieceVersion: step.settings.pieceVersion,
              stepKey: step.settings.actionName,
            };
          }
          if (step.type === FlowTriggerType.PIECE) {
            return {
              stepName: step.name,
              pieceName: step.settings.pieceName,
              pieceVersion: step.settings.pieceVersion,
              stepKey: step.settings.triggerName,
            };
          }
          return null;
        })
        .filter(
          (
            entry,
          ): entry is {
            stepName: string;
            pieceName: string;
            pieceVersion: string;
            stepKey: string;
          } =>
            entry !== null &&
            Boolean(entry.pieceName) &&
            Boolean(entry.stepKey),
        ),
    [steps],
  );

  const pieceQueries = useQueries({
    queries: piecePairs.map(({ pieceName, pieceVersion }) => ({
      queryKey: ['piece', pieceName, pieceVersion],
      queryFn: () =>
        piecesApi.get({
          name: pieceName,
          version: pieceVersion,
          locale: i18n.language as LocalesEnum,
        }),
      staleTime: Infinity,
    })),
  });

  const schemaMap = useMemo<Record<string, OutputSchema | null>>(() => {
    const result: Record<string, OutputSchema | null> = {};
    piecePairs.forEach(({ stepName, stepKey }, idx) => {
      const piece = pieceQueries[idx]?.data as PieceMetadataModel | undefined;
      result[stepName] =
        piece?.triggers?.[stepKey]?.outputSchema ??
        piece?.actions?.[stepKey]?.outputSchema ??
        null;
    });
    return result;
  }, [piecePairs, pieceQueries]);

  const advancedStructure = useMemo(
    () =>
      buildAdvancedStructure(
        steps,
        sampleData,
        isFocusInsideListMapperModeInput,
        selectedStepName,
      ),
    [steps, sampleData, isFocusInsideListMapperModeInput, selectedStepName],
  );

  const friendlyStructure = useMemo(
    () =>
      steps.map((step) => {
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
              propertyPath: pathHelpers.propertyPathStarter(step.name),
              insertable: true,
              stepName: step.name,
            },
            children: [
              {
                key: `${step.name}_value`,
                data: {
                  type: 'value' as const,
                  value: stepData,
                  displayName: t('Result'),
                  propertyPath: pathHelpers.propertyPathStarter(step.name),
                  insertable: true,
                },
              },
            ],
          };
        }

        const schema = schemaMap[step.name];

        if (Array.isArray(stepData) && stepData.length > 0) {
          const arrayKind = schemaTreeUtils.selectArrayTreeKind(schema);
          // A whole-output wrapper schema (single value:'' field) names the
          // array itself — render it object-style so the wrapper field sits at
          // the top with rows beneath, instead of wrapping each row in Item N.
          if (schema && arrayKind === 'wrapper') {
            return schemaTreeUtils.buildTreeFromSchema({
              stepName: step.name,
              displayName,
              schema,
              sampleData: stepData,
            });
          }
          if (schema && arrayKind === 'perItem') {
            return schemaTreeUtils.buildTreeFromArrayWithSchema({
              stepName: step.name,
              displayName,
              schema,
              items: stepData,
            });
          }
          return schemaTreeUtils.buildTreeFromArray({
            stepName: step.name,
            displayName,
            items: stepData,
          });
        }

        if (schema) {
          return schemaTreeUtils.buildTreeFromSchema({
            stepName: step.name,
            displayName,
            schema,
            sampleData: stepData,
          });
        }
        try {
          return dataSelectorUtils.traverseStep(
            step,
            sampleData,
            isFocusInsideListMapperModeInput,
            selectedStepName,
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
      }),
    [
      steps,
      sampleData,
      schemaMap,
      isFocusInsideListMapperModeInput,
      selectedStepName,
    ],
  );

  const currentStructure =
    viewMode === 'friendly' ? friendlyStructure : advancedStructure;
  const filteredNodes = useMemo(
    () => dataSelectorUtils.filterBy(currentStructure, searchTerm),
    [currentStructure, searchTerm],
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

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={cn(
        'absolute bottom-0 mr-5 mb-5 right-0 z-50 transition-all  border border-solid border-outline overflow-x-hidden bg-background shadow-lg rounded-md',
        {
          'opacity-0 pointer-events-none': !showDataSelector,
        },
        textMentionUtils.dataSelectorCssClassSelector,
      )}
    >
      <div className="text-lg items-center px-3 py-2 flex gap-2">
        {t('Data Selector')} <div className="grow"></div>{' '}
        <DataSelectorSizeTogglers
          state={dataSelectorSize}
          setListSizeState={setDataSelectorSize}
        ></DataSelectorSizeTogglers>
      </div>
      <div
        style={{
          height:
            dataSelectorSize === DataSelectorSizeState.COLLAPSED
              ? '0px'
              : dataSelectorSize === DataSelectorSizeState.DOCKED
              ? '450px'
              : `${parentHeight - 100}px`,
          width:
            dataSelectorSize !== DataSelectorSizeState.EXPANDED
              ? '450px'
              : `${parentWidth - 40}px`,
        }}
        className="transition-all overflow-hidden"
      >
        <Tabs
          key={defaultTab}
          defaultValue={defaultTab}
          className="h-full flex flex-col gap-0"
        >
          <TabsList
            variant="outline"
            className="px-3 shrink-0 gap-1 border-b border-border w-full justify-start"
          >
            <TabsTrigger
              value="data"
              variant="outline"
              className="gap-2 px-3 py-2 hover:text-foreground rounded-none"
            >
              <Database className="w-4 h-4" />
              {t('Data')}
            </TabsTrigger>
            <TabsTrigger
              value="variables"
              variant="outline"
              className="gap-2 px-3 py-2 hover:text-foreground rounded-none"
            >
              <Variable className="w-4 h-4" />
              {t('Variables')}
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="data"
            className="flex-1 min-h-0 flex flex-col gap-2 mt-2"
          >
            <div className="flex items-center gap-2 px-5">
              <SearchInput
                onChange={(e) => setSearchTerm(e)}
                value={searchTerm}
              ></SearchInput>
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
            <ScrollArea className="transition-all flex-1 w-full ">
              {filteredNodes.map((node) => (
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
          </TabsContent>

          <TabsContent value="variables" className="flex-1 min-h-0 mt-2">
            <VariablesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

DataSelector.displayName = 'DataSelector';
export { DataSelector };
