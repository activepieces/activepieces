import { PrimeReactProvider } from 'primereact/api';
import { Tree, TreeExpandedKeysType } from 'primereact/tree';
import { useState } from 'react';

import { ScrollArea } from '../../../components/ui/scroll-area';
import { builderSelectors, useBuilderStateContext } from '../builder-hooks';

import './data-to-insert-list.css';

import { NodeTemplate } from './data-to-insert-node';
import { ListSizeState, ListSizeTogglers } from './list-size-togglers';

import { useRipple } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

export function DataToInsertList() {
  const [listSizeState, setListSizeState] = useState<ListSizeState>(
    ListSizeState.DOCKED,
  );
  const ripple = useRipple();
  const flowVersion = useBuilderStateContext((state) => state.flowVersion);
  const nodes = useBuilderStateContext(builderSelectors.getAllStepsMentions);
  const [expandedKeys, setExpandedKeys] = useState<TreeExpandedKeysType>({});
  const selectStep = useBuilderStateContext((state) => state.selectStep);
  const insertMention = useBuilderStateContext((state) => state.insertMention);
  return (
    <div
      className={cn(
        'absolute bottom-[20px]  right-[20px] z-50 transition-all  border border-solid border-outline overflow-x-hidden bg-background shadow-lg rounded-md',
        {
          'h-[calc(100%-40px)] max-w-[500px]  w-[500px] max-h-[calc(100%-40px)] w-[calc(100%-40px)] max-w-[calc(100%-40px)]':
            listSizeState === ListSizeState.EXPANDED,
          'w-[500px] max-w-[500px]': listSizeState === ListSizeState.COLLAPSED,
          'opacity-0  pointer-events-none': nodes.length === 0,
          'opacity-100': nodes.length > 0,
        },
      )}
    >
      <div className="text-lg items-center font-semibold px-5 py-2 flex gap-2">
        Data Selector <div className="flex-grow"></div>{' '}
        <ListSizeTogglers
          state={listSizeState}
          setListSizeState={setListSizeState}
        ></ListSizeTogglers>
      </div>
      <ScrollArea
        className={cn('transition-all', {
          'h-[calc(100%-100px)] max-h-[calc(100%-100px)]':
            listSizeState === ListSizeState.EXPANDED,
          'h-[450px] max-h-[450px]  max-w-[450px]  w-[450px]':
            listSizeState === ListSizeState.DOCKED,
          'h-[0px]': listSizeState === ListSizeState.COLLAPSED,
        })}
      >
        <PrimeReactProvider value={{ ripple: true }}>
          <Tree
            value={nodes}
            expandedKeys={expandedKeys}
            togglerTemplate={() => <></>}
            nodeTemplate={NodeTemplate({
              ripple,
              setExpandedKeys,
              expandedKeys,
              selectStep,
              insertMention,
              flowVersion,
            })}
            onToggle={(e) => setExpandedKeys(e.value)}
            className="w-full"
          />
        </PrimeReactProvider>
      </ScrollArea>
    </div>
  );
}
