import { t } from 'i18next';
import React from 'react';
import { useFormContext } from 'react-hook-form';

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from '@/components/ui/form';
import { ReadMoreDescription } from '@/components/ui/read-more-description';
import { Switch } from '@/components/ui/switch';
import { FlowAction, FlowTrigger } from '@activepieces/shared';

type ActionErrorHandlingFormProps = {
  hideContinueOnFailure?: boolean;
  hideRetryOnFailure?: boolean;
  disabled: boolean;
};

const ActionErrorHandlingForm = React.memo(
  ({
    hideContinueOnFailure,
    hideRetryOnFailure,
    disabled,
  }: ActionErrorHandlingFormProps) => {
    const form = useFormContext<FlowAction | FlowTrigger>();

    return (
      <div className="grid gap-4">
        {hideContinueOnFailure !== true && (
          <FormField
            name="settings.errorHandlingOptions.continueOnFailure.value"
            control={form.control}
            render={({ field }) => (
              <FormItem className="flex flex-col items-start justify-between">
                <FormLabel
                  htmlFor="continueOnFailure"
                  className="flex items-center justify-center"
                >
                  <FormControl>
                    <Switch
                      disabled={disabled}
                      id="continueOnFailure"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <span className="ml-3 flex-grow">
                    {t('Continue on Failure')}
                  </span>
                </FormLabel>
                <ReadMoreDescription
                  text={t(
                    'Enable this option to skip this step and continue the flow normally if it fails.',
                  )}
                />
              </FormItem>
            )}
          />
        )}
        {hideRetryOnFailure !== true && (
          <FormField
            name="settings.errorHandlingOptions.retryOnFailure.value"
            control={form.control}
            render={({ field }) => (
              <FormItem className="flex flex-col items-start justify-between">
                <FormLabel
                  htmlFor="retryOnFailure"
                  className="flex items-center justify-center"
                >
                  <FormControl>
                    <Switch
                      disabled={disabled}
                      id="retryOnFailure"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <span className="ml-3 grow">{t('Retry on Failure')}</span>
                </FormLabel>
                <ReadMoreDescription
                  text={t(
                    'Automatically retry up to four attempts when failed.',
                  )}
                />
              </FormItem>
            )}
          />
        )}
      </div>
    );
  },
);

ActionErrorHandlingForm.displayName = 'ActionErrorHandlingForm';
export { ActionErrorHandlingForm };
