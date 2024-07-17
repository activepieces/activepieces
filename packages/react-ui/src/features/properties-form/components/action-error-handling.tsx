import { Static, Type } from '@sinclair/typebox';
import React from 'react';
import { useForm } from 'react-hook-form';

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { ErrorHandlingOptionsParam } from '@activepieces/pieces-framework';

import { ReadMoreDescription } from './read-more-description';

const formSchema = Type.Object({
  continueOnFailure: Type.Boolean(),
  retryOnFailure: Type.Boolean(),
});

type FormSchema = Static<typeof formSchema>;

type ActionErrorHandlingFormControlProps = {
  errorHandlingOptions: ErrorHandlingOptionsParam;
  onContinueOnFailureChange: (value: boolean) => void;
  onRetryOnFailureChange: (value: boolean) => void;
};

const ActionErrorHandlingFormControl = React.memo(
  ({
    errorHandlingOptions,
    onContinueOnFailureChange,
    onRetryOnFailureChange,
  }: ActionErrorHandlingFormControlProps) => {
    const errorHandlingOptionsForm = useForm<FormSchema>({
      defaultValues: {
        continueOnFailure: errorHandlingOptions.continueOnFailure.defaultValue,
        retryOnFailure: errorHandlingOptions.retryOnFailure.defaultValue,
      },
    });
    const continueOnFailureHandler = (value: boolean) => {
      errorHandlingOptionsForm.setValue('continueOnFailure', value);
      onContinueOnFailureChange(value);
    };

    const retryOnFailureHandler = (value: boolean) => {
      errorHandlingOptionsForm.setValue('retryOnFailure', value);
      onRetryOnFailureChange(value);
    };

    return (
      <Form {...errorHandlingOptionsForm}>
        <div className="grid gap-4">
          {errorHandlingOptions.continueOnFailure.hide !== false && (
            <FormField
              name="continueOnFailure"
              control={errorHandlingOptionsForm.control}
              render={({ field }) => (
                <FormItem className="flex flex-col items-start justify-between">
                  <FormLabel
                    htmlFor="continueOnFailure"
                    className="flex items-center justify-center"
                  >
                    <FormControl>
                      <Switch
                        id="continueOnFailure"
                        checked={field.value}
                        onCheckedChange={continueOnFailureHandler}
                      />
                    </FormControl>
                    <span className="ml-3 flex-grow">Continue on Failure</span>
                  </FormLabel>
                  <ReadMoreDescription text="Enable this option to skip this step and continue the flow normally if it fails." />
                </FormItem>
              )}
            />
          )}
          {errorHandlingOptions.retryOnFailure.hide !== false && (
            <FormField
              name="retryOnFailure"
              control={errorHandlingOptionsForm.control}
              render={({ field }) => (
                <FormItem className="flex flex-col items-start justify-between">
                  <FormLabel
                    htmlFor="retryOnFailure"
                    className="flex items-center justify-center"
                  >
                    <FormControl>
                      <Switch
                        id="retryOnFailure"
                        checked={field.value}
                        onCheckedChange={retryOnFailureHandler}
                      />
                    </FormControl>
                    <span className="ml-3 grow">Retry on Failure</span>
                  </FormLabel>
                  <ReadMoreDescription text="Automatically retry up to four attempts when failed." />
                </FormItem>
              )}
            />
          )}
        </div>
      </Form>
    );
  },
);

ActionErrorHandlingFormControl.displayName = 'ActionErrorHandlingFormControl';
export { ActionErrorHandlingFormControl };
