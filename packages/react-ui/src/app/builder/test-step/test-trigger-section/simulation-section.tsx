import { t } from 'i18next';
import { AlertCircle } from 'lucide-react';
import React from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/spinner';

import { ManualWebhookTestButton } from './manual-webhook-test-button';

type SimulationSectionProps = {
  isWebhookPieceTrigger: boolean;
  pieceModel: any;
  triggerName: string;
  isWebhookTestingDialogOpen: boolean;
  setIsWebhookTestingDialogOpen: (open: boolean) => void;
  resetSimulation: () => void;
  abortControllerRef: React.MutableRefObject<AbortController>;
};

export const SimulationSection = ({
  isWebhookPieceTrigger,
  pieceModel,
  triggerName,
  isWebhookTestingDialogOpen,
  setIsWebhookTestingDialogOpen,
  resetSimulation,
  abortControllerRef,
}: SimulationSectionProps) => {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex gap-2 items-center justify-center w-full">
        <LoadingSpinner className="w-4 h-4"></LoadingSpinner>
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

      <Alert className="bg-warning/5 border-warning/5 ">
        <AlertCircle className="h-4 w-4 text-warning" />
        <div className="flex flex-col gap-1">
          <AlertTitle>{t('Action Required')}:</AlertTitle>
          <AlertDescription>
            {!isWebhookPieceTrigger &&
              t('testPieceWebhookTriggerNote', {
                pieceName: pieceModel.displayName,
                triggerName: pieceModel.triggers[triggerName].displayName,
              })}

            {isWebhookPieceTrigger && (
              <div className="break-wrods">
                {t(
                  'Send Data to the webhook URL to generate sample data to use in the next steps',
                )}
              </div>
            )}
          </AlertDescription>
        </div>
      </Alert>
      {isWebhookPieceTrigger && (
        <ManualWebhookTestButton
          isWebhookTestingDialogOpen={isWebhookTestingDialogOpen}
          setIsWebhookTestingDialogOpen={setIsWebhookTestingDialogOpen}
        />
      )}
    </div>
  );
};
