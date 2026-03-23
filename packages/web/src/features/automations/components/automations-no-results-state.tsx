import { t } from 'i18next';
import { SearchX } from 'lucide-react';

import { Button } from '@/components/ui/button';

type AutomationsNoResultsStateProps = {
  onClearFilters: () => void;
};

export const AutomationsNoResultsState = ({
  onClearFilters,
}: AutomationsNoResultsStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <SearchX className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{t('No results found')}</h3>
      <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
        {t(
          "We couldn't find any automations matching your search or filters. Try adjusting your criteria.",
        )}
      </p>
      <Button variant="outline" onClick={onClearFilters}>
        {t('Clear filters')}
      </Button>
    </div>
  );
};
