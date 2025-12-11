import { t } from 'i18next';

const FlowEndWidget = () => {
  return (
    <div
      className="px-2.5 py-1.5 text-center w-[50px] bg-border/80 text-foreground/70 rounded-full animate-fade -left-[25px] absolute"
      key={'flow-end-button'}
      id='flow-end-button'
    >
      {t('End')}
    </div>
  );
};

FlowEndWidget.displayName = 'FlowEndWidget';
export default FlowEndWidget;
