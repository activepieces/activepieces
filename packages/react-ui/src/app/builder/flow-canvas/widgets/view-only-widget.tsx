import { Button } from '@/components/ui/button';
import { t } from 'i18next';

const ViewOnlyWidget = () => {
  return (
    <Button
      variant="ghost"
      className="h-8 bg-muted text-accent-foreground border-none disabled:opacity-100"
      disabled={true}
      key={'view-only-button'}
    >
      {t('View Only')}
    </Button>
  );
};

ViewOnlyWidget.displayName = 'ViewOnlyWidget';
export default ViewOnlyWidget;
