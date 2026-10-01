import { ApFlagId, feedbackUrl } from '@activepieces/shared';
import { t } from 'i18next';
import { MessageSquarePlusIcon, SearchXIcon } from 'lucide-react';

import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { flagsHooks } from '@/hooks/flags-hooks';

const NoResultsFound = () => {
  const { data: showCommunityLinks } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_COMMUNITY,
  );
  const isEmbedding = useEmbedding().embedState.isEmbedded;
  const showRequestPieceButton = showCommunityLinks && !isEmbedding;

  return (
    <Empty className="h-full">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchXIcon />
        </EmptyMedia>
        <EmptyTitle>{t('No results found')}</EmptyTitle>
        <EmptyDescription>{t('Try a different search term')}</EmptyDescription>
      </EmptyHeader>
      {showRequestPieceButton && (
        <EmptyContent>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              window.open(`${feedbackUrl}`, '_blank', 'noopener noreferrer');
            }}
          >
            <MessageSquarePlusIcon />
            {t('Request Piece')}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
};

export { NoResultsFound };
