import { t } from 'i18next';

const FlowEndWidget = () => {
  return (
    <div
      className="w-[41px] -translate-x-1/2 animate-fade rounded-lg bg-gray-2 text-center text-gray-12/70"
      key={'flow-end-button'}
      id="flow-end-button"
    >
      <div className="h-full w-full rounded-lg bg-gray-5 p-1 text-center text-xs">
        {t('End')}
      </div>
    </div>
  );
};

FlowEndWidget.displayName = 'FlowEndWidget';
export default FlowEndWidget;
