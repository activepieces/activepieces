import { t } from 'i18next';
import { Puzzle } from 'lucide-react';

export const McpEmptyTools = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4 border rounded-lg bg-muted/20">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
        <Puzzle className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-medium">{t('No Tools Added Yet')}</h3>
      <p className="text-muted-foreground text-center max-w-md">
        {t('Add your first tool to start building powerful integrations')}
      </p>
    </div>
  );
};
