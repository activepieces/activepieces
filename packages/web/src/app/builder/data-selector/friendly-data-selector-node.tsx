import { flowStructureUtil, isNil, isObject } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { useState } from 'react';

import { FieldTypeIcon } from '@/components/custom/smart-output-viewer/field-type-icon';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { PieceIcon, stepsHooks } from '@/features/pieces';
import { cn } from '@/lib/utils';

import { useBuilderStateContext } from '../builder-hooks';

import { TestStepSection } from './test-step-section';
import { DataSelectorTreeNode } from './type';
import { dataSelectorUtils } from './utils';

const MAX_PREVIEW_LENGTH = 30;

function truncatePreview(value: unknown): {
  text: string;
  isTruncated: boolean;
  fullText: string;
} {
  if (isNil(value) || value === '')
    return { text: '', isTruncated: false, fullText: '' };
  if (Array.isArray(value))
    return {
      text: `${value.length} ${t('items')}`,
      isTruncated: false,
      fullText: '',
    };
  if (isObject(value))
    return {
      text: `${Object.keys(value).length} ${t('fields')}`,
      isTruncated: false,
      fullText: '',
    };
  const str = String(value);
  if (str.length > MAX_PREVIEW_LENGTH) {
    return {
      text: str.slice(0, MAX_PREVIEW_LENGTH) + '...',
      isTruncated: true,
      fullText: str,
    };
  }
  return { text: str, isTruncated: false, fullText: str };
}

function FieldRow({
  node,
  depth,
  searchTerm,
}: {
  node: DataSelectorTreeNode;
  depth: number;
  searchTerm: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const insertMention = useBuilderStateContext((state) => state.insertMention);

  if (dataSelectorUtils.isTestStepNode(node)) {
    return <TestStepSection stepName={node.data.stepName} />;
  }

  if (node.data.type !== 'value') return null;

  const hasChildren = node.children && node.children.length > 0;
  const isInsertable = node.data.type === 'value' && node.data.insertable;
  const paddingLeft = 16 + depth * 20;

  const handleInsert = () => {
    if (insertMention && isInsertable && node.data.type === 'value') {
      insertMention(node.data.propertyPath);
    }
  };

  const handleRowClick = () => {
    if (hasChildren) {
      setExpanded(!expanded);
    } else if (isInsertable) {
      handleInsert();
    }
  };

  return (
    <div>
      <div
        onClick={handleRowClick}
        className={cn(
          'flex items-center gap-2 min-h-[36px] cursor-pointer hover:bg-accent/50 group transition-colors',
          expanded && hasChildren && 'bg-accent/30',
        )}
        style={{ paddingLeft }}
      >
        {hasChildren ? (
          <div className="shrink-0 w-4 h-4 flex items-center justify-center text-muted-foreground">
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </div>
        ) : (
          <div className="shrink-0 w-4" />
        )}

        <FieldTypeIcon
          value={node.data.type === 'value' ? node.data.value : undefined}
        />
        <span className="text-sm font-medium text-muted-foreground shrink-0 max-w-[140px] truncate">
          {node.data.displayName}
        </span>

        {!hasChildren &&
          node.data.type === 'value' &&
          (() => {
            const isEmpty = isNil(node.data.value) || node.data.value === '';
            const preview = isEmpty ? null : truncatePreview(node.data.value);
            return (
              <>
                <span className="text-muted-foreground/40 shrink-0">:</span>
                <span
                  className={cn(
                    'text-sm truncate flex-1 min-w-0',
                    isEmpty
                      ? 'text-muted-foreground/40 italic'
                      : 'text-foreground/70',
                  )}
                  title={preview?.isTruncated ? preview.fullText : undefined}
                >
                  {isEmpty ? t('empty') : preview?.text}
                </span>
              </>
            );
          })()}

        {hasChildren &&
          !expanded &&
          (() => {
            const preview = truncatePreview(node.data.value);
            return (
              <span
                className="text-sm text-muted-foreground/60 truncate flex-1 min-w-0"
                title={preview.isTruncated ? preview.fullText : undefined}
              >
                {preview.text}
              </span>
            );
          })()}

        <div className="ml-auto shrink-0 pr-3">
          {isInsertable && (
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 h-6 px-1.5 text-xs gap-0.5"
              onClick={(e) => {
                e.stopPropagation();
                handleInsert();
              }}
            >
              <Plus className="h-3 w-3" />
              {t('Insert')}
            </Button>
          )}
        </div>
      </div>

      {expanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <FieldRow
              key={child.key}
              node={child}
              depth={depth + 1}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StepHeader({ node }: { node: DataSelectorTreeNode }) {
  const flowVersion = useBuilderStateContext((state) => state.flowVersion);

  const step =
    node.data.type === 'value'
      ? flowStructureUtil.getStep(node.data.propertyPath, flowVersion.trigger)
      : undefined;
  const { stepMetadata } = stepsHooks.useStepMetadata({ step });

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30">
      {stepMetadata && (
        <PieceIcon
          displayName={stepMetadata.displayName}
          logoUrl={stepMetadata.logoUrl}
          showTooltip={false}
          border={false}
          size="sm"
        />
      )}
      <span className="text-sm font-semibold">
        {node.data.type === 'value'
          ? node.data.displayName
          : node.data.type === 'chunk'
          ? node.data.displayName
          : ''}
      </span>
    </div>
  );
}

type FriendlyDataSelectorNodeProps = {
  node: DataSelectorTreeNode;
  searchTerm: string;
};

function FriendlyDataSelectorNode({
  node,
  searchTerm,
}: FriendlyDataSelectorNodeProps) {
  const [expanded, setExpanded] = useState(false);

  const isTestNode = dataSelectorUtils.isTestStepNode(node);
  if (isTestNode) {
    return <TestStepSection stepName={node.data.stepName} />;
  }

  const autoExpand = !!searchTerm;
  const hasChildren = node.children && node.children.length > 0;

  if (!hasChildren) {
    return (
      <Collapsible
        className="w-full border-b border-dividers last:border-b-0"
        open={expanded || autoExpand}
        onOpenChange={setExpanded}
      >
        <CollapsibleTrigger asChild className="w-full">
          <button
            type="button"
            className="w-full flex items-center hover:bg-accent/30 transition-colors"
          >
            <StepHeader node={node} />
            <div className="ml-auto pr-3 text-muted-foreground">
              {expanded || autoExpand ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <FieldRow node={node} depth={0} searchTerm={searchTerm} />
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <Collapsible
      className="w-full border-b border-dividers last:border-b-0"
      open={expanded || autoExpand}
      onOpenChange={setExpanded}
    >
      <CollapsibleTrigger asChild className="w-full">
        <button
          type="button"
          className="w-full flex items-center hover:bg-accent/30 transition-colors"
        >
          <StepHeader node={node} />
          <div className="ml-auto pr-3 text-muted-foreground">
            {expanded || autoExpand ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {hasChildren &&
          node.children!.map((child) => (
            <FieldRow
              key={child.key}
              node={child}
              depth={0}
              searchTerm={searchTerm}
            />
          ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

FriendlyDataSelectorNode.displayName = 'FriendlyDataSelectorNode';
export { FriendlyDataSelectorNode };
