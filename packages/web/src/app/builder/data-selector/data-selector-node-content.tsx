import {
  FlowAction,
  FlowTrigger,
  flowStructureUtil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { useApRipple } from '@/components/providers/theme-provider';
import { Button } from '@/components/ui/button';
import { PieceIcon, stepsHooks } from '@/features/pieces';
import { cn } from '@/lib/utils';

import { useBuilderStateContext } from '../builder-hooks';

import { DataSelectorTreeNode } from './type';

const INDENT_PER_DEPTH = 14;
const VALUE_PREVIEW_MAX_LENGTH = 60;

type DataSelectorNodeContentProps = {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  depth: number;
  node: DataSelectorTreeNode;
};

const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    if (event.target) {
      (event.target as HTMLDivElement).click();
    }
  }
};

const DataSelectorNodeContent = ({
  node,
  expanded,
  setExpanded,
  depth,
}: DataSelectorNodeContentProps) => {
  const flowVersion = useBuilderStateContext((state) => state.flowVersion);
  const insertMention = useBuilderStateContext((state) => state.insertMention);

  const [ripple, rippleEvent] = useApRipple();

  const stepForRoot =
    depth === 0 && node.data.type === 'value'
      ? flowStructureUtil.getStep(node.data.propertyPath, flowVersion.trigger)
      : depth === 0 && node.data.type === 'test'
      ? flowStructureUtil.getStep(node.data.stepName, flowVersion.trigger)
      : undefined;

  const isExpandable = !!node.children && node.children.length > 0;
  const isStepRoot = depth === 0;
  const isPrimitiveStepRoot = isStepRoot && !isExpandable;
  const isLeafValue =
    !isExpandable && node.data.type === 'value' && !isStepRoot;
  const isInsertable =
    node.data.type === 'value' && node.data.insertable && !node.isLoopStepNode;
  const showInsertButton = isInsertable && (!isStepRoot || isPrimitiveStepRoot);

  const arrayValue =
    node.data.type === 'value' && Array.isArray(node.data.value)
      ? (node.data.value as unknown[])
      : null;
  const showArrayCount = isExpandable && arrayValue !== null;

  const handleClick = (e: React.MouseEvent) => {
    if (isExpandable) {
      rippleEvent(e);
      setExpanded(!expanded);
      return;
    }
    if (isInsertable && insertMention && node.data.type === 'value') {
      rippleEvent(e);
      insertMention(node.data.propertyPath);
    }
  };

  const showValuePreview = (isLeafValue || isPrimitiveStepRoot) && isInsertable;
  const valuePreview =
    showValuePreview && node.data.type === 'value'
      ? formatValuePreview(node.data.value)
      : '';

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyPress}
      ref={ripple}
      onClick={handleClick}
      className={cn(
        'w-full max-w-full select-none focus:outline-hidden cursor-pointer group transition-colors',
        'hover:bg-accent/60 focus:bg-accent dark:hover:bg-accent/20',
      )}
      data-depth={depth}
    >
      <div
        className={cn(
          'flex items-center gap-1.5 pr-2 min-w-0',
          isStepRoot ? 'min-h-[40px] py-1.5' : 'min-h-[32px]',
        )}
        style={{ paddingLeft: depth * INDENT_PER_DEPTH + 12 }}
      >
        {!isStepRoot && isExpandable && (
          <ChevronRight
            className={cn(
              'size-3.5 shrink-0 text-muted-foreground transition-transform',
              expanded && 'rotate-90',
            )}
          />
        )}
        {!isStepRoot && !isExpandable && (
          <div className="size-3.5 shrink-0" aria-hidden />
        )}

        {isStepRoot && stepForRoot && <StepRootIcon step={stepForRoot} />}

        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {node.data.type !== 'test' && (
            <span
              className={cn(
                'truncate min-w-0 shrink-0 max-w-[40%]',
                isStepRoot
                  ? 'font-medium text-foreground text-sm'
                  : 'text-foreground text-sm',
              )}
            >
              {node.data.displayName}
            </span>
          )}

          {showArrayCount && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {t('{count, plural, =1 {1 item} other {# items}}', {
                count: arrayValue?.length ?? 0,
              })}
            </span>
          )}

          {showValuePreview && valuePreview !== '' && (
            <>
              <span className="shrink-0 text-muted-foreground">:</span>
              <TextWithTooltip tooltipMessage={String(valuePreview)}>
                <span className="min-w-0 truncate text-primary text-sm flex-1">
                  {valuePreview}
                </span>
              </TextWithTooltip>
            </>
          )}
        </div>

        {showInsertButton && (
          <Button
            variant="basic"
            size="sm"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              if (insertMention && node.data.type === 'value') {
                insertMention(node.data.propertyPath);
              }
            }}
            className={cn(
              'h-6 px-2 text-xs text-primary shrink-0 opacity-0 transition-opacity',
              'group-hover:opacity-100 focus-visible:opacity-100',
            )}
          >
            {t('Insert')}
          </Button>
        )}

        {isStepRoot && isExpandable && (
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform',
              !expanded && '-rotate-90',
            )}
          />
        )}
      </div>
    </div>
  );
};

const StepRootIcon = ({ step }: { step: FlowAction | FlowTrigger }) => {
  const { stepMetadata } = stepsHooks.useStepMetadata({ step });
  if (!stepMetadata) return null;
  return (
    <div className="shrink-0">
      <PieceIcon
        displayName={stepMetadata.displayName}
        logoUrl={stepMetadata.logoUrl}
        showTooltip={false}
        border={false}
        size="xs"
      />
    </div>
  );
};

const formatValuePreview = (value: unknown): string => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') {
    const trimmed = value.replace(/\s+/g, ' ').trim();
    return trimmed.length > VALUE_PREVIEW_MAX_LENGTH
      ? `${trimmed.slice(0, VALUE_PREVIEW_MAX_LENGTH)}…`
      : trimmed;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  const json = JSON.stringify(value);
  return json.length > VALUE_PREVIEW_MAX_LENGTH
    ? `${json.slice(0, VALUE_PREVIEW_MAX_LENGTH)}…`
    : json;
};

DataSelectorNodeContent.displayName = 'DataSelectorNodeContent';
export { DataSelectorNodeContent };
