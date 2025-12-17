import { t } from 'i18next';

const FlowEndWidget = () => {
  return (
    <div
      className=" text-center w-[50px] bg-builder-background text-foreground/70 rounded-lg animate-fade -ml-[25px]"
      key={'flow-end-button'}
      id="flow-end-button"
    >
      <div className="w-full px-2 py-1 text-center h-full bg-border/80 rounded-lg ">
        {t('End')}
      </div>
    </div>
  );
};

FlowEndWidget.displayName = 'FlowEndWidget';
export default FlowEndWidget;
