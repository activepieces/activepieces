import { t } from 'i18next';
import { AlertCircle } from 'lucide-react';
import React from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/spinner';

type SimulationSectionProps = {
  note: React.ReactNode;
  resetSimulation: () => void;
  abortControllerRef: React.MutableRefObject<AbortController>;
};

export const SimulationNote = ({
  note,
  resetSimulation,
  abortControllerRef,
}: SimulationSectionProps) => {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex gap-2 items-center justify-center w-full">
        <LoadingSpinner className="size-4"></LoadingSpinner>
        <div>{t('Testing Trigger')}</div>
        <div className="flex-grow"></div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            resetSimulation();
            abortControllerRef.current.abort();
            abortControllerRef.current = new AbortController();
          }}
        >
          {t('Cancel')}
        </Button>
      </div>

      {note && (
        <Alert>
          <AlertCircle className="h-4 w-4 text-warning" />
          <div className="flex flex-col gap-1">
            <AlertTitle>{t('Action Required')}:</AlertTitle>
            <AlertDescription>
              <div className="break-wrods">{note}</div>
            </AlertDescription>
          </div>
        </Alert>
      )}
    </div>
  );
};
