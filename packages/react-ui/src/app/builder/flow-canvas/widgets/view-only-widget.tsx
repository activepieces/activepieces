import { t } from 'i18next';

const ViewOnlyWidget = () => {
  return (
    <div
      className="p-2 bg-border text-foreground/70 rounded-lg animate-fade"
      key={'view-only-widget'}
    >
      {t('View Only')}
    </div>
  );
};

ViewOnlyWidget.displayName = 'ViewOnlyWidget';
export default ViewOnlyWidget;
