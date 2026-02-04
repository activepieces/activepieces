import { t } from 'i18next';
import { Info } from 'lucide-react';
import React from 'react';
import { useFormContext } from 'react-hook-form';

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn, GAP_SIZE_FOR_STEP_SETTINGS } from '@/lib/utils';
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
      <div className={cn('grid', GAP_SIZE_FOR_STEP_SETTINGS)}>
        {hideContinueOnFailure !== true && (
          <FormField
            name="settings.errorHandlingOptions.continueOnFailure.value"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel
                  htmlFor="continueOnFailure"
                  className="flex items-center gap-1"
                >
                  <FormControl>
                    <Switch
                      disabled={disabled}
                      id="continueOnFailure"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <span className="ml-2">{t('Continue on Failure')}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 stroke-foreground/55 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      {t(
                        'Enable this option to skip this step and continue the flow normally if it fails.',
                      )}
                    </TooltipContent>
                  </Tooltip>
                </FormLabel>
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
                  className="flex items-center gap-1"
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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 stroke-foreground/55 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      {t(
                        'Automatically retry up to four attempts when failed.',
                      )}
                    </TooltipContent>
                  </Tooltip>
                </FormLabel>
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
