import { t } from 'i18next';

const ViewOnlyWidget = () => {
  return (
    <div
      className="p-1 px-2 text-sm  bg-border text-foreground/70 rounded-md animate-fade"
      key={'view-only-widget'}
    >
      {t('View Only')}
    </div>
  );
};

ViewOnlyWidget.displayName = 'ViewOnlyWidget';
export default ViewOnlyWidget;
