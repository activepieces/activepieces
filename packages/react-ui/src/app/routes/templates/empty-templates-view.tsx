import { t } from 'i18next';
import { SearchX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

type EmptyTemplatesViewProps = {
  search: string;
  isPlatformAdmin: boolean;
};

export const EmptyTemplatesView = ({
  search,
  isPlatformAdmin,
}: EmptyTemplatesViewProps) => {
  const navigate = useNavigate();

  return (
    <Empty className="min-h-[300px]">
      <EmptyHeader className="max-w-xl">
        <EmptyMedia variant="icon">
          <SearchX />
        </EmptyMedia>
        <EmptyTitle>{t('No templates found')}</EmptyTitle>
        <EmptyDescription>
          {search
            ? t(
                'No templates match your search criteria. Try adjusting your search terms.',
              )
            : t('No templates are available at the moment.')}
        </EmptyDescription>
      </EmptyHeader>
      {!search && isPlatformAdmin && (
        <EmptyContent>
          <Button onClick={() => navigate('/platform/setup/templates')}>
            {t('Setup Templates')}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
};
