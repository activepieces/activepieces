import { t } from 'i18next';
import { useState } from 'react';

import { JsonViewer } from '@/components/custom/json-viewer';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import { FriendlyDataView } from './friendly-data-view';

type DataDisplayTabsProps = {
  data: unknown;
  title: string;
  className?: string;
};

const DataDisplayTabs = ({ data, title, className }: DataDisplayTabsProps) => {
  const [view, setView] = useState<'friendly' | 'raw'>('friendly');

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-end">
        <Tabs
          value={view}
          onValueChange={(value) => setView(value as 'friendly' | 'raw')}
        >
          <TabsList className="h-7.5">
            <TabsTrigger value="friendly" className="text-xs px-2.5 py-0.5">
              {t('Friendly View')}
            </TabsTrigger>
            <TabsTrigger value="raw" className="text-xs px-2.5 py-0.5">
              {t('Raw JSON')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {view === 'friendly' ? (
        <FriendlyDataView data={data} />
      ) : (
        <JsonViewer
          json={data}
          title={title}
          hideHeader
          hideDownload
          className="border border-solid border-dividers rounded-md"
        />
      )}
    </div>
  );
};

DataDisplayTabs.displayName = 'DataDisplayTabs';
export { DataDisplayTabs };
