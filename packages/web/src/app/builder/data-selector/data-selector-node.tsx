import { DataSelectorNodeContent } from './data-selector-node-content';
import { TestStepSection } from './test-step-section';
import { DataSelectorTreeNode } from './type';
import { dataSelectorUtils } from './utils';

type DataSelectorNodeProps = {
  node: DataSelectorTreeNode;
  depth: number;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
};

const DataSelectorNode = ({
  node,
  depth,
  expanded,
  setExpanded,
}: DataSelectorNodeProps) => {
  const isTestStepNode = dataSelectorUtils.isTestStepNode(node);
  if (isTestStepNode) {
    return <TestStepSection stepName={node.data.stepName}></TestStepSection>;
  }

  return (
    <DataSelectorNodeContent
      node={node}
      expanded={expanded}
      setExpanded={setExpanded}
      depth={depth}
    ></DataSelectorNodeContent>
  );
};
DataSelectorNode.displayName = 'DataSelectorNode';
export { DataSelectorNode };
