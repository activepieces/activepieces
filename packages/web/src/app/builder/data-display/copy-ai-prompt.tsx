import { FriendlyPieceError } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import {
  ErrorExplanationContext,
  explanationPromptUtils,
} from './explanation-prompt';

type CopyAiPromptButtonProps = {
  error: FriendlyPieceError;
  context: ErrorExplanationContext;
  className?: string;
};

const COPIED_FEEDBACK_DURATION_MS = 2000;

const CopyAiPromptButton = ({
  error,
  context,
  className,
}: CopyAiPromptButtonProps) => {
  const [copied, setCopied] = useState(false);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
    },
    [],
  );

  const handleCopy = async () => {
    const prompt = explanationPromptUtils.build({ error, context });
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast.success(t('Prompt copied to clipboard'), {
        description: t('Paste it into any AI assistant to get a diagnosis.'),
        duration: COPIED_FEEDBACK_DURATION_MS,
      });
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
      copiedTimeoutRef.current = setTimeout(
        () => setCopied(false),
        COPIED_FEEDBACK_DURATION_MS,
      );
    } catch (err) {
      console.error('Failed to copy AI prompt', err);
      toast.error(t('Could not copy the prompt to your clipboard.'));
    }
  };

  return (
    <div className={cn('px-4 py-3 border-t border-border', className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="gap-1.5"
      >
        {copied ? (
          <Check className="size-3.5 text-success" />
        ) : (
          <Sparkles className="size-3.5 text-primary" />
        )}
        {copied ? t('Copied') : t('Copy Error for AI')}
      </Button>
    </div>
  );
};

CopyAiPromptButton.displayName = 'CopyAiPromptButton';

export { CopyAiPromptButton };
