import { ApFlagId, feedbackUrl } from '@activepieces/shared';
import { MessageAdd01Icon, SearchRemoveIcon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
import { flagsHooks } from '@/hooks/flags-hooks';

const NoResultsFound = () => {
  const { data: showCommunityLinks } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_COMMUNITY,
  );
  const isEmbedding = useEmbedding().embedState.isEmbedded;
  const showRequestPieceButton = showCommunityLinks && !isEmbedding;

  return (
    <div className="flex flex-col items-center justify-center gap-3 h-full px-6 text-center">
      <div className="flex items-center justify-center size-12 rounded-full bg-gray-3">
        <HugeiconsIcon
          icon={SearchRemoveIcon}
          className="size-6 text-gray-11"
        />
      </div>
      <div className="flex flex-col gap-1">
        <div className="text-sm font-medium text-gray-12">
          {t('No results found')}
        </div>
        <div className="text-xs text-gray-11">
          {t('Try a different search term')}
        </div>
      </div>
      {showRequestPieceButton && (
        <Button
          variant="outline"
          size="sm"
          className="mt-1"
          onClick={() => {
            window.open(`${feedbackUrl}`, '_blank', 'noopener noreferrer');
          }}
        >
          <HugeiconsIcon icon={MessageAdd01Icon} className="size-4 mr-2" />
          {t('Request Piece')}
        </Button>
      )}
    </div>
  );
};

export { NoResultsFound };
