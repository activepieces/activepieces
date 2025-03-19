import { TemplateTabProps } from '@activepieces/shared';
import { t } from 'i18next';
const TemplateTabs = ({ activeTab, selectActiveTab }: TemplateTabProps) => {
  
const tabs = [
  {
    id: 'MY_TEMPLATE',
    label: 'My Templates',
  },
  {
    id: 'COMMUNITY_TEMPLATE',
    label: 'Community Templates',
  },
];
  return (
    <div className="font-medium flex border-b border-gray-200 mb-4 cursor-pointer">
      {tabs.map(({ id, label }) => (
        <div
          onClick={() => selectActiveTab(id)}
          className={`p-4 hover:!text-primary ${
            id === activeTab &&
            '!text-primary border-b-2 border-blue-600 rounded-t-lg active'
          } `}
        >
          {t(label)}
        </div>
      ))}
    </div>
  );
};
export { TemplateTabs };
