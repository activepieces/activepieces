import { t } from 'i18next';

const FlowEndWidget = () => {
  return (

    <div
          className="px-2 py-1 text-center w-[50px] bg-border/80 text-foreground/70 rounded-lg animate-fade -ml-[25px]"
          key={'flow-end-button'}
          id='flow-end-button'
        >
          {t('End')}
        </div>
    
  );
};

FlowEndWidget.displayName = 'FlowEndWidget';
export default FlowEndWidget;
