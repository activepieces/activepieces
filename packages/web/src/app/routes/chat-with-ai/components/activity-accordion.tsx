import { t } from 'i18next';
import { ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo } from 'react';

import { TextShimmer } from '@/components/ui/text-shimmer';
import { AnyToolPart, chatPartUtils } from '@/features/chat/lib/chat-types';
import { cn } from '@/lib/utils';

export function ThinkingBlock({
  toolParts,
  reasoningText,
  isStreaming,
  onOpenDetails,
}: {
  toolParts: AnyToolPart[];
  reasoningText: string;
  isStreaming: boolean;
  onOpenDetails?: () => void;
}) {
  const visibleCount = useMemo(
    () =>
      toolParts.filter(
        (p) =>
          !chatPartUtils.HIDDEN_TOOL_NAMES.has(
            chatPartUtils.getToolPartName(p),
          ),
      ).length,
    [toolParts],
  );

  const hasReasoning = reasoningText.length > 0;
  const hasVisibleParts = visibleCount > 0;

  if (!hasVisibleParts && !hasReasoning && !isStreaming) return null;

  const doneLabel =
    visibleCount > 0
      ? t('stepsCompleted', { count: visibleCount })
      : t('Thought for a few seconds');

  const isClickable = hasVisibleParts || hasReasoning;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <button
        type="button"
        disabled={!isClickable}
        onClick={onOpenDetails}
        className={cn(
          'flex items-center gap-1.5 text-sm text-muted-foreground text-left',
          isClickable &&
            'hover:text-foreground transition-colors cursor-pointer',
        )}
      >
        {isStreaming ? (
          <TextShimmer className="text-sm" duration={3}>
            {t('Thinking...')}
          </TextShimmer>
        ) : (
          <span>{doneLabel}</span>
        )}
        {isClickable && (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground/50" />
        )}
      </button>
    </motion.div>
  );
}
