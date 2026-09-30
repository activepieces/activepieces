import { t } from 'i18next';

const FlowEndWidget = () => {
  return (
    <div
      className="w-[41px] -translate-x-1/2 animate-fade rounded-md bg-gray-2 text-center text-gray-12/70"
      key={'flow-end-button'}
      id="flow-end-button"
    >
      <div className="w-full text-center text-sm h-full bg-gray-6/80 p-1 rounded-md">
        {t('End')}
      </div>
    </div>
  );
};

FlowEndWidget.displayName = 'FlowEndWidget';
export default FlowEndWidget;
