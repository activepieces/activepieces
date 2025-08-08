import { t } from 'i18next';
import { Cloud } from 'lucide-react';
import React from 'react';

import { LoadingSpinner } from '@/components/ui/spinner';

interface AgentSavingIndicatorProps {
  isSaving: boolean;
  hasSaved: boolean;
}

export const AgentSavingIndicator: React.FC<AgentSavingIndicatorProps> = ({
  isSaving,
  hasSaved,
}) => {
  if (!isSaving && !hasSaved) return null;
  return (
    <div className="flex items-center gap-1 text-xs h-6">
      {isSaving ? (
        <>
          <LoadingSpinner className="w-4 h-4" />
          <span>{t('Saving...')}</span>
        </>
      ) : (
        <>
          <Cloud className="w-4 h-4" />
          <span>{t('Saved')}</span>
        </>
      )}
    </div>
  );
};
