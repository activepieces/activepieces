import { FlowAction, FlowTrigger } from '@activepieces/shared';
import { t } from 'i18next';
import { ShieldAlert } from 'lucide-react';
import React from 'react';
import { useFormContext } from 'react-hook-form';

import { ReadMoreDescription } from '@/components/custom/read-more-description';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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

    if (hideContinueOnFailure === true && hideRetryOnFailure === true) {
      return null;
    }

    return (
      <div className={cn('flex flex-col', GAP_SIZE_FOR_STEP_SETTINGS)}>
        <Separator />
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          <Label className="text-base">{t('Error handling')}</Label>
        </div>
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
                    'Adds Success and Failure branches, errors go into Failure.',
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
                  text={t('Retries up to 4 times before failing the step.')}
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
