import { t } from 'i18next';

const FlowEndWidget = () => {
  return (
    <div
      className="px-2.5 py-1.5 bg-accent text-foreground/70 rounded-full animate-fade"
      key={'flow-end-button'}
    >
      {t('End')}
    </div>
  );
};

FlowEndWidget.displayName = 'FlowEndWidget';
export default FlowEndWidget;
