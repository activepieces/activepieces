import { ApFlagId, feedbackUrl } from '@activepieces/shared';
import { t } from 'i18next';
import { MessageSquarePlusIcon, SearchXIcon } from 'lucide-react';

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
      <div className="flex items-center justify-center size-12 rounded-full bg-muted">
        <SearchXIcon className="size-6 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-1">
        <div className="text-sm font-medium text-foreground">
          {t('No results found')}
        </div>
        <div className="text-xs text-muted-foreground">
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
          <MessageSquarePlusIcon className="size-4 mr-2" />
          {t('Request Piece')}
        </Button>
      )}
    </div>
  );
};

export { NoResultsFound };
