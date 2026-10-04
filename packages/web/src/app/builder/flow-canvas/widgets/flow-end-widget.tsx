import { t } from 'i18next';

const FlowEndWidget = () => {
  return (
    <div
      className=" text-center w-[41px] bg-gray-2 text-gray-12/70 rounded-md animate-fade -ml-[20px]"
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
