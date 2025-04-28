import { CollapsibleContent } from '@radix-ui/react-collapsible';
import { useEffect, useState } from 'react';

import {
  Collapsible,
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
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (searchTerm && depth <= 1) {
      setExpanded(true);
    } else if (!searchTerm) {
      setExpanded(false);
    }
  }, [searchTerm, depth]);

  const isTestStepNode = dataSelectorUtils.isTestStepNode(node);
  if (isTestStepNode) {
    return <TestStepSection stepName={node.data.stepName}></TestStepSection>;
  }

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
          {node.children && node.children.length > 0 && (
            <div className="flex flex-col ">
              {node.children.map((node) => (
                <DataSelectorNode
                  depth={depth + 1}
                  node={node}
                  key={node.key}
                  searchTerm={searchTerm}
                ></DataSelectorNode>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </>
    </Collapsible>
  );
};
DataSelectorNode.displayName = 'DataSelectorNode';
export { DataSelectorNode };
