import { FriendlyPieceError } from '@activepieces/core-utils';
import { t } from 'i18next';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
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

const CopyAiPromptButton = ({
  error,
  context,
  className,
}: CopyAiPromptButtonProps) => {
  return (
    <div className={cn('px-4 py-3 border-t border-gray-6', className)}>
      <CopyButton
        value={explanationPromptUtils.build({ error, context })}
        variant="outline"
        size="sm"
        className="gap-1.5"
      >
        {t('Copy Error for AI')}
      </CopyButton>
    </div>
  );
};

CopyAiPromptButton.displayName = 'CopyAiPromptButton';

export { CopyAiPromptButton };
