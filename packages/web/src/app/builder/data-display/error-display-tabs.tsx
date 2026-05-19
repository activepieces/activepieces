import { FriendlyPieceError } from '@activepieces/shared';
import { t } from 'i18next';
import { useState } from 'react';

import { JsonViewer } from '@/components/custom/json-viewer';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import { ErrorExplanationContext } from './explanation-prompt';
import { FriendlyErrorView } from './friendly-error-view';

type ErrorDisplayTabsProps = {
  error: FriendlyPieceError;
  explanationContext?: ErrorExplanationContext;
  pieceDisplayName?: string;
  className?: string;
};

const stripInternalMarker = (
  error: FriendlyPieceError,
): Record<string, unknown> => {
  const entries = Object.entries(error).filter(
    ([key]) => key !== '__apErrorVersion',
  );
  return Object.fromEntries(entries);
};

const ErrorDisplayTabs = ({
  error,
  explanationContext,
  pieceDisplayName,
  className,
}: ErrorDisplayTabsProps) => {
  const [view, setView] = useState<'friendly' | 'raw'>('friendly');
  const rawPayload = stripInternalMarker(error);

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
        <FriendlyErrorView
          error={error}
          explanationContext={explanationContext}
          pieceDisplayName={pieceDisplayName}
        />
      ) : (
        <JsonViewer
          json={rawPayload}
          title={t('Error')}
          hideHeader
          hideDownload
          className="border border-solid border-dividers rounded-md"
        />
      )}
    </div>
  );
};

ErrorDisplayTabs.displayName = 'ErrorDisplayTabs';

export { ErrorDisplayTabs };
