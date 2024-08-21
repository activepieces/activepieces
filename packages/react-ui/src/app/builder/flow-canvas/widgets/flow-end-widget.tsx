import { Button } from '@/components/ui/button';
import { t } from 'i18next';

const FlowEndWidget = () => {
  return (
    <Button
      variant="ghost"
      className="h-8 bg-muted text-accent-foreground border-none disabled:opacity-100"
      disabled={true}
      key={'flow-end-button'}
    >
      {t('End')}
    </Button>
  );
};

FlowEndWidget.displayName = 'FlowEndWidget';
export default FlowEndWidget;
