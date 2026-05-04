import { FlowAction, FlowTrigger } from '@activepieces/shared';
import { t } from 'i18next';
import React from 'react';
import { useFormContext } from 'react-hook-form';

import { ReadMoreDescription } from '@/components/custom/read-more-description';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { cn, GAP_SIZE_FOR_STEP_SETTINGS } from '@/lib/utils';

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
      <div className={cn('grid', GAP_SIZE_FOR_STEP_SETTINGS)}>
        {hideContinueOnFailure !== true && (
          <FormField
            name="settings.errorHandlingOptions.continueOnFailure.value"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel
                  htmlFor="continueOnFailure"
                  className="flex items-center gap-1 h-7.5 max-h-7.5"
                >
                  <FormControl>
                    <Switch
                      disabled={disabled}
                      id="continueOnFailure"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <span className="ml-2">{t('Add Error Handler')}</span>
                </FormLabel>
                <ReadMoreDescription
                  text={t(
                    'Adds branches for success and failure, you can pass the error message to your failure branch.',
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
              <FormItem>
                <FormLabel
                  htmlFor="retryOnFailure"
                  className="flex items-center gap-1 h-7.5 max-h-7.5"
                >
                  <FormControl>
                    <Switch
                      disabled={disabled}
                      id="retryOnFailure"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <span className="ml-2">{t('Retry on Failure')}</span>
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
