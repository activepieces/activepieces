import { t } from 'i18next';
import { SearchX } from 'lucide-react';

import { useEmbedding } from '@/components/embed-provider';
import { Button } from '@/components/ui/button';
import { flagsHooks } from '@/hooks/flags-hooks';
import { ApFlagId, supportUrl } from '@activepieces/shared';

const NoResultsFound = () => {
  const { data: showCommunityLinks } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_COMMUNITY,
  );
  const isEmbedding = useEmbedding().embedState.isEmbedded;
  const showRequestPieceButton = showCommunityLinks && !isEmbedding;

  return (
    <div className="flex flex-col gap-2 items-center justify-center h-full ">
      <SearchX className="w-14 h-14" />
      <div className="text-sm ">{t('No pieces found')}</div>
      <div className="text-sm ">{t('Try adjusting your search')}</div>
      {showRequestPieceButton && (
        <Button
          variant="default"
          size="sm"
          onClick={() => {
            window.open(
              `${supportUrl}/c/feature-requests/9`,
              '_blank',
              'noopener noreferrer',
            );
          }}
        >
          {t('Request Piece')}
        </Button>
      )}
    </div>
  );
};

export { NoResultsFound };
