import { ChevronDown, ChevronUp } from 'lucide-react';
import { PrimeReactProvider } from 'primereact/api';
import {
  Tree,
  TreeExpandedKeysType,
  TreeNodeTemplateOptions,
} from 'primereact/tree';
import { TreeNode } from 'primereact/treenode';
import { useState, useEffect } from 'react';

import { NodeService } from './node-service';

import './data-to-insert-list.css';
import { useRipple } from '@/components/theme-provider';

export default function DataToInsertList() {
  const ripple = useRipple();
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<TreeExpandedKeysType>({
    '0': true,
    '0-0': true,
  });
  const nodeTemplate = (node: TreeNode, options: TreeNodeTemplateOptions) => {
    const expanded = options.expanded;
    const nodeHasChildren = node.children && node.children.length > 0;
    const toggleIconSize = 15;
    const togglerIcon = expanded ? (
      <ChevronUp height={toggleIconSize} width={toggleIconSize}></ChevronUp>
    ) : (
      <ChevronDown height={toggleIconSize} width={toggleIconSize}></ChevronDown>
    );
    const toggleNode = () => {
      if (expanded && node.key) {
        delete expandedKeys[node.key];
      } else {
        expandNode(node, expandedKeys);
      }
      setExpandedKeys({ ...expandedKeys });
    };
    return (
      <div
        className="p-ripple hover:bg-accent flex-grow flex cursor-pointer"
        onClick={toggleNode}
      >
        <div className="flex min-h-[48px] px-5  select-none flex-grow  items-center gap-2">
          <div className="flex-grow item-label ap-px-4">{node.label}</div>
          {nodeHasChildren && togglerIcon}
        </div>
        {ripple}
      </div>
    );
  };
  const togglerTemplate = () => <></>;

  const expandNode = (node: TreeNode, _expandedKeys: TreeExpandedKeysType) => {
    if (node.children && node.children.length && node.key) {
      _expandedKeys[node.key] = true;
    }
  };

  useEffect(() => {
    NodeService.getTreeNodes().then((data) => setNodes(data));
  }, []);

  return (
    <PrimeReactProvider value={{ ripple: true }}>
      <Tree
        value={nodes}
        expandedKeys={expandedKeys}
        togglerTemplate={togglerTemplate}
        nodeTemplate={nodeTemplate}
        onToggle={(e) => setExpandedKeys(e.value)}
        className="w-full"
      />
    </PrimeReactProvider>
  );
}
