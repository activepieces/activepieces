import { flowHelper, FlowVersion } from '@activepieces/shared';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { TreeExpandedKeysType, TreeProps } from 'primereact/tree';
import React from 'react';

import { useRipple } from '../../../components/theme-provider';
import { Button } from '../../../components/ui/button';
import { PieceIcon } from '../../../features/pieces/components/piece-icon';
import { piecesHooks } from '../../../features/pieces/lib/pieces-hook';
import {
  dataToInsertListUtils,
  MentionTreeNode,
} from '../../../lib/data-to-insert-list-utils';
import { StepPathWithName } from '../builder-hooks';

import { TestStepSection } from './test-step-section';

const ToggleIcon = (expanded: boolean) => {
  const toggleIconSize = 15;
  return expanded ? (
    <ChevronUp height={toggleIconSize} width={toggleIconSize}></ChevronUp>
  ) : (
    <ChevronDown height={toggleIconSize} width={toggleIconSize}></ChevronDown>
  );
};

type NodeTemplateProps = {
  setExpandedKeys: React.Dispatch<React.SetStateAction<TreeExpandedKeysType>>;
  expandedKeys: TreeExpandedKeysType;
  selectStep: (path: StepPathWithName) => void;
  insertMention: (propertyPath: string) => void;
  flowVersion: FlowVersion;
  ripple: ReturnType<typeof useRipple>;
};
export const DataSelectorNodeTemplate: (
  req: NodeTemplateProps,
) => TreeProps['nodeTemplate'] = ({
  setExpandedKeys,
  expandedKeys,
  selectStep,
  insertMention,
  ripple,
  flowVersion,
}) => {
  const nodeTemplate: TreeProps['nodeTemplate'] = (node, { expanded }) => {
    const actualNode = node as MentionTreeNode;
    if (actualNode.data.isTestStepNode) {
      return TestStepSection(actualNode.data.propertyPath, selectStep);
    }
    const step =
      dataToInsertListUtils.isStepName(actualNode.data.propertyPath) &&
      !actualNode.data.isSlice
        ? flowHelper.getStep(flowVersion, actualNode.data.propertyPath)
        : undefined;

    const stepMetadata = step
      ? piecesHooks.useStepMetadata({ step })
      : undefined;
    const showInsertButton =
      !actualNode.data.isSlice &&
      !(
        actualNode.children &&
        actualNode.children.length > 0 &&
        actualNode.children[0].data.isTestStepNode
      );
    const showNodeValue = !actualNode.children && !!actualNode.data.value;
    const toggleNode = () => {
      if (expanded && node.key) {
        delete expandedKeys[node.key];
      } else if (node.children && node.children.length && node.key) {
        expandedKeys[node.key] = true;
      }
      setExpandedKeys({ ...expandedKeys });
    };
    return (
      <div
        className="p-ripple select-none hover:bg-accent hover:bg-opacity-75 flex-grow flex cursor-pointer group"
        onClick={() => {
          if (actualNode.children && actualNode.children.length > 0) {
            toggleNode();
          } else {
            insertMention(actualNode.data.propertyPath);
          }
        }}
      >
        <div className="flex min-h-[48px] px-5  select-none flex-grow  items-center gap-2">
          <div className="flex-grow ap-px-4 flex items-center  gap-3 ">
            {stepMetadata?.data && (
              <PieceIcon
                displayName={stepMetadata.data.displayName}
                logoUrl={stepMetadata.data.logoUrl}
                showTooltip={false}
                circle={false}
                border={false}
                size="sm"
              ></PieceIcon>
            )}
            {actualNode.data.displayName}
            {showNodeValue && (
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
          {node.children && node.children.length > 0 && ToggleIcon(expanded)}
        </div>
        {ripple}
      </div>
    );
  };
  return nodeTemplate;
};
