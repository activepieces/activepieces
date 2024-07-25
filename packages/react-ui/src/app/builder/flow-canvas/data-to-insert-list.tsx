import { ChevronDown, ChevronUp } from 'lucide-react';
import { PrimeReactProvider } from 'primereact/api';
import {
  Tree,
  TreeExpandedKeysType,
  TreeNodeTemplateOptions,
} from 'primereact/tree';
import { TreeNode } from 'primereact/treenode';
import { useState } from 'react';

import { Button } from '../../../components/ui/button';
import { piecesHooks } from '../../../features/pieces/lib/pieces-hook';
import {
  builderSelectors,
  StepPathWithName,
  useBuilderStateContext,
} from '../builder-hooks';
import { isStepName, MentionTreeNode } from '../mentions-utils';

import './data-to-insert-list.css';

import { useRipple } from '@/components/theme-provider';

const TestStepSection = (
  stepName: string,
  selectStep: (path: StepPathWithName) => void,
) => {
  const isTrigger = stepName === 'trigger';
  const text = isTrigger
    ? ` This trigger needs to have data loaded from your account, to use as sample data`
    : `This step needs to be tested in order to view its data`;

  const btn = (
    <Button
      onClick={() => {
        selectStep({ path: [], stepName });
      }}
      variant="default"
      size="default"
    >
      {' '}
      {isTrigger ? 'Go to Trigger' : 'Go to Step'}{' '}
    </Button>
  );
  return (
    <div className="flex flex-col gap-3 select-none  flex-grow items-center justify-center p-2">
      <div>{text}</div>
      <div>{btn}</div>
    </div>
  );
};
const StepIcon = ({ stepName }: { stepName: string }) => {
  const iconSize = 24;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const step = useBuilderStateContext(builderSelectors.getStep(stepName));
  if (step) {
    const { data } = piecesHooks.usePieceMetadata({ step });
    if (data) {
      return (
        <img
          src={data.logoUrl}
          className="object-contain"
          width={iconSize}
          height={iconSize}
        ></img>
      );
    }
  }
  return <></>;
};
const NodeTemplate = ({
  ripple,
  expandNode,
  setExpandedKeys,
  expandedKeys,
  selectStep,
  insertMention,
}: {
  ripple: ReturnType<typeof useRipple>;
  expandNode: (
    node: MentionTreeNode,
    _expandedKeys: TreeExpandedKeysType,
  ) => void;
  setExpandedKeys: React.Dispatch<React.SetStateAction<TreeExpandedKeysType>>;
  expandedKeys: TreeExpandedKeysType;
  selectStep: (path: StepPathWithName) => void;
  insertMention: (propertyPath: string) => void;
}) => {
  const node = (node: TreeNode, options: TreeNodeTemplateOptions) => {
    const actualNode = node as MentionTreeNode;
    const testStepSectionElement = actualNode.data.isTestStepNode
      ? TestStepSection(actualNode.data.propertyPath, selectStep)
      : null;
    if (testStepSectionElement) return testStepSectionElement;

    const isStep =
      isStepName(actualNode.data.propertyPath) && !actualNode.data.isSlice;
    const expanded = options.expanded;
    const nodeHasChildren = node.children && node.children.length > 0;
    const toggleIconSize = 15;
    const stepIconElement = isStep
      ? StepIcon({ stepName: actualNode.data.propertyPath })
      : undefined;
    const showInsertButton =
      !actualNode.data.isSlice &&
      !(actualNode.children && actualNode.children[0].data.isTestStepNode);
    const togglerIcon = expanded ? (
      <ChevronUp height={toggleIconSize} width={toggleIconSize}></ChevronUp>
    ) : (
      <ChevronDown height={toggleIconSize} width={toggleIconSize}></ChevronDown>
    );
    const toggleNode = () => {
      if (expanded && node.key) {
        delete expandedKeys[node.key];
      } else {
        expandNode(actualNode, expandedKeys);
      }
      setExpandedKeys({ ...expandedKeys });
    };
    return (
      <div
        className="p-ripple select-none hover:bg-accent hover:bg-opacity-75 flex-grow flex cursor-pointer group"
        onClick={() => {
          if (nodeHasChildren) {
            toggleNode();
          } else {
            insertMention(actualNode.data.propertyPath);
          }
        }}
      >
        <div className="flex min-h-[48px] px-5  select-none flex-grow  items-center gap-2">
          <div className="flex-grow ap-px-4 flex items-center  gap-3 ">
            {stepIconElement}
            {actualNode.data.displayName}
            {!actualNode.children && !!actualNode.data.value && (
              <>
                <div>:</div>
                <div className="text-primary truncate ">
                  {`${actualNode.data.value}`}
                </div>
              </>
            )}
            {showInsertButton && (
              <>
                <div className="flex-grow"></div>
                <Button
                  className="z-50 hover:opacity-100 opacity-0 group-hover:opacity-100"
                  variant="basic"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    insertMention(actualNode.data.propertyPath);
                  }}
                >
                  Insert
                </Button>
              </>
            )}
          </div>
          {nodeHasChildren && togglerIcon}
        </div>
        {ripple}
      </div>
    );
  };
  return node;
};

export function DataToInsertList() {
  const ripple = useRipple();
  const nodes = useBuilderStateContext(builderSelectors.getAllStepsMentions);
  const [expandedKeys, setExpandedKeys] = useState<TreeExpandedKeysType>({});
  const expandNode = (
    node: MentionTreeNode,
    _expandedKeys: TreeExpandedKeysType,
  ) => {
    if (node.children && node.children.length && node.key) {
      _expandedKeys[node.key] = true;
    }
  };
  const selectStep = useBuilderStateContext((state) => state.selectStep);
  const insertMention = useBuilderStateContext((state) => state.insertMention);
  return (
    <PrimeReactProvider value={{ ripple: true }}>
      <Tree
        value={nodes}
        expandedKeys={expandedKeys}
        togglerTemplate={() => <></>}
        nodeTemplate={NodeTemplate({
          ripple,
          expandNode,
          setExpandedKeys,
          expandedKeys,
          selectStep,
          insertMention,
        })}
        onToggle={(e) => setExpandedKeys(e.value)}
        className="w-full"
      />
    </PrimeReactProvider>
  );
}
