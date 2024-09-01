import { t } from 'i18next';

const ViewOnlyWidget = () => {
  return (
    <div
      className="px-2.5 py-1.5 bg-accent text-foreground/70 rounded-full animate-fade"
      key={'view-only-widget'}
    >
      {t('View Only')}
    </div>
  );
};

ViewOnlyWidget.displayName = 'ViewOnlyWidget';
export default ViewOnlyWidget;
