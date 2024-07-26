import {
  ChevronDown,
  ChevronUp,
  ExpandIcon,
  MinimizeIcon,
  MinusIcon,
  PanelRightDashedIcon,
} from 'lucide-react';
import { PrimeReactProvider } from 'primereact/api';
import {
  Tree,
  TreeExpandedKeysType,
  TreeNodeTemplateOptions,
} from 'primereact/tree';
import { TreeNode } from 'primereact/treenode';
import { useState } from 'react';

import { Button } from '../../../components/ui/button';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { piecesHooks } from '../../../features/pieces/lib/pieces-hook';
import {
  builderSelectors,
  StepPathWithName,
  useBuilderStateContext,
} from '../builder-hooks';
import {  MentionTreeNode,dataToInsertListUtils } from '../../../lib/data-to-insert-list-utils';

import './data-to-insert-list.css';

import { useRipple } from '@/components/theme-provider';

const TestStepSection = (
  stepName: string,
  selectStep: (path: StepPathWithName) => void,
) => {
  const isTrigger = stepName === 'trigger';
  const text = isTrigger
    ? `This trigger needs to have data loaded from your account, to use as sample data.`
    : `This step needs to be tested in order to view its data.`;

  const btn = (
    <Button
      onClick={() => {
        selectStep({ path: [], stepName });
      }}
      variant="default"
      size="default"
    >
      {isTrigger ? 'Go to Trigger' : 'Go to Step'}{' '}
    </Button>
  );
  return (
    <div className="flex flex-col gap-3 select-none text-center px-12 py-2 flex-grow items-center justify-center ">
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
    dataToInsertListUtils.isStepName(actualNode.data.propertyPath) && !actualNode.data.isSlice;
    const expanded = options.expanded;
    const nodeHasChildren = node.children && node.children.length > 0;
    const toggleIconSize = 15;
    const stepIconElement = isStep
      ? StepIcon({ stepName: actualNode.data.propertyPath })
      : undefined;
    const showInsertButton =
      !actualNode.data.isSlice &&
      !(actualNode.children && actualNode.children.length > 0 && actualNode.children[0].data.isTestStepNode);
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
enum ListSizeState {
  EXPANDED,
  COLLAPSED,
  DOCKED,
}

const ListSizes = ({
  state,
  setListSizeState,
}: {
  state: ListSizeState;
  setListSizeState: (state: ListSizeState) => void;
}) => {
  const handleClick = (newState: ListSizeState) => {
    setListSizeState(newState);
  };
  const buttonClassName = (btnState: ListSizeState) =>
    state === btnState ? 'text-outline' : 'text-outline opacity-50';
  return (
    <>
      <Button
        size="icon"
        className={buttonClassName(ListSizeState.EXPANDED)}
        onClick={() => handleClick(ListSizeState.EXPANDED)}
        variant="basic"
      >
        <ExpandIcon></ExpandIcon>
      </Button>
      <Button
        size="icon"
        className={buttonClassName(ListSizeState.DOCKED)}
        onClick={() => handleClick(ListSizeState.DOCKED)}
        variant="basic"
      >
        <PanelRightDashedIcon></PanelRightDashedIcon>
      </Button>
      <Button
        size="icon"
        className={buttonClassName(ListSizeState.COLLAPSED)}
        onClick={() => handleClick(ListSizeState.COLLAPSED)}
        variant="basic"
      >
        <MinusIcon></MinusIcon>
      </Button>
    </>
  );
};

export function DataToInsertList({ children }: { children: React.ReactNode }) {
  const [listSizeState, setListSizeState] = useState<ListSizeState>(
    ListSizeState.DOCKED,
  );
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
  const containerDefaultClassName = `absolute bottom-[20px]  right-[20px] z-50 transition-all  border border-solid border-outline overflow-x-hidden bg-white shadow-lg rounded-md`;
  const containerSizeClassName =
    listSizeState === ListSizeState.EXPANDED
      ? `h-[calc(100%-40px)] max-h-[calc(100%-40px)] w-[calc(100%-40px)] max-w-[calc(100%-40px)]`
      : ` w-[500px] max-w-[500px]`;
  const containerVisibilityClassName =
    nodes.length === 0 ? 'opacity-0  pointer-events-none' : 'opacity-100';
  const scrollAreaClassName =
    listSizeState === ListSizeState.EXPANDED
      ? `h-[calc(100%-100px)] max-h-[calc(100%-100px)]`
      : listSizeState === ListSizeState.DOCKED
      ? `h-[450px] max-h-[450px] `
      : `h-[0px]`;
  const containerClassName = `${containerDefaultClassName} ${containerSizeClassName} ${containerVisibilityClassName}`;

  return (
    <div className={containerClassName}>
      <div className="text-lg items-center font-semibold px-5 py-2 flex gap-2">
        Data Selector <div className="flex-grow"></div>{' '}
        <ListSizes
          state={listSizeState}
          setListSizeState={setListSizeState}
        ></ListSizes>
      </div>
      <ScrollArea className={`${scrollAreaClassName} transition-all`}>
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
      </ScrollArea>
    </div>
  );
}
