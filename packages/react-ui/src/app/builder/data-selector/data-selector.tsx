import { useRef, useState } from 'react';

import { ScrollArea } from '../../../components/ui/scroll-area';
import {
  builderSelectors,
  useBuilderStateContext,
  useDataSelectorVisibility,
} from '../builder-hooks';

import './data-selector.css';
import { DataSelectorNode } from './data-selector-node';
import {
  DataSelectorSizeState,
  DataSelectorSizeTogglers,
} from './data-selector-size-togglers';

import { cn } from '@/lib/utils';

import { MentionTreeNode } from '../../../lib/data-selector-utils';
import { Input } from '../../../components/ui/input';

import { SearchXIcon } from 'lucide-react';

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

export const DataSelector = ({
  parentHeight,
  parentWidth,
}: {
  parentWidth: number;
  parentHeight: number;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [DataSelectorSize, setDataSelectorSize] =
    useState<DataSelectorSizeState>(DataSelectorSizeState.DOCKED);
  const [searchTerm, setSearchTerm] = useState('');
  const mentions = useBuilderStateContext(builderSelectors.getAllStepsMentions);
  const nodes = filterBy(mentions, searchTerm);
  const [showDataSelector, setShowDataSelector] = useState(false);
  useDataSelectorVisibility({
    containerRef,
    setShowDataSelector,
  });
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
        <div>
          <ScrollArea
            className={cn('transition-all ', {
              'h-full': DataSelectorSize === DataSelectorSizeState.EXPANDED,
              'h-[390px] max-h-[390px]  max-w-[450px]  w-[450px]':
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
                  searchTerm={searchTerm}
                ></DataSelectorNode>
              ))}
            {nodes.length === 0 && (
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
    </div>
  );
};
DataSelector.displayName = 'DataSelector';
