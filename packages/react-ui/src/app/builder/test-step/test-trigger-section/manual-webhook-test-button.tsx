import { t } from 'i18next';
import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { FlowTrigger } from '@activepieces/shared';

import TestWebhookDialog from '../custom-test-step/test-webhook-dialog';

type ManualWebhookTestButtonProps = {
  isWebhookTestingDialogOpen: boolean;
  setIsWebhookTestingDialogOpen: (open: boolean) => void;
};

export const ManualWebhookTestButton = ({
  isWebhookTestingDialogOpen,
  setIsWebhookTestingDialogOpen,
}: ManualWebhookTestButtonProps) => {
  const [id, setId] = useState<number>(0);
  const formValues = useFormContext<FlowTrigger>().getValues();

  return (
    <>
      <Button
        variant="default"
        size="sm"
        className="flex items-center gap-2"
        onClick={() => {
          setIsWebhookTestingDialogOpen(true);
        }}
      >
        {t('Generate Sample Data')}
      </Button>

      <TestWebhookDialog
        key={`test-webhook-dialog-${id}`}
        open={isWebhookTestingDialogOpen}
        onOpenChange={(val) => {
          if (!val) {
            setTimeout(() => {
              setId(id + 1);
            }, 200);
          }
          setIsWebhookTestingDialogOpen(val);
        }}
        testingMode="trigger"
        currentStep={formValues}
      />
    </>
  );
};
