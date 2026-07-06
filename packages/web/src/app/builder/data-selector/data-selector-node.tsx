import { useEffect, useState } from 'react';

import { VirtualizedList } from '@/components/ui/virtualized-list';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../../components/ui/collapsible';

import { DataSelectorNodeContent } from './data-selector-node-content';
import { TestStepSection } from './test-step-section';
import { DataSelectorTreeNode } from './type';
import { dataSelectorUtils } from './utils';

type DataSelectorNodeProps = {
  node: DataSelectorTreeNode;
  depth: number;
  searchTerm: string;
};

const DataSelectorNode = ({
  node,
  depth,
  searchTerm,
}: DataSelectorNodeProps) => {
  const [expanded, setExpanded] = useState(depth === 0);

  useEffect(() => {
    if (searchTerm) {
      setExpanded(true);
    } else {
      setExpanded(depth === 0);
    }
  }, [searchTerm, depth]);

  const isTestStepNode = dataSelectorUtils.isTestStepNode(node);
  if (isTestStepNode) {
    return <TestStepSection stepName={node.data.stepName}></TestStepSection>;
  }

  const children = node.children ?? [];

  return (
    <Collapsible className="w-full" open={expanded} onOpenChange={setExpanded}>
      <>
        <CollapsibleTrigger asChild={true} className="w-full relative">
          <DataSelectorNodeContent
            node={node}
            expanded={expanded}
            setExpanded={setExpanded}
            depth={depth}
          ></DataSelectorNodeContent>
        </CollapsibleTrigger>
        <CollapsibleContent className="w-full">
          {children.length > 0 && (
            <div className="flex flex-col ">
              <VirtualizedList
                items={children}
                estimateSize={32}
                getItemKey={(index) => children[index].key}
                renderItem={(child) => (
                  <DataSelectorNode
                    depth={depth + 1}
                    node={child}
                    searchTerm={searchTerm}
                  ></DataSelectorNode>
                )}
              />
            </div>
          )}
        </CollapsibleContent>
      </>
    </Collapsible>
  );
};
DataSelectorNode.displayName = 'DataSelectorNode';
export { DataSelectorNode };
