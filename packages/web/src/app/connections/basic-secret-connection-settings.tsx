import { BasicAuthProperty } from '@activepieces/pieces-framework';
import { UpsertBasicAuthRequest } from '@activepieces/shared';
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';

import { SecretInput } from './secret-input';

type BasicAuthConnectionSettingsProps = {
  authProperty: BasicAuthProperty;
};

const BasicAuthConnectionSettings = React.memo(
  ({ authProperty }: BasicAuthConnectionSettingsProps) => {
    const forSchema = z.object({
      request: UpsertBasicAuthRequest,
    });
    const form = useFormContext<z.infer<typeof forSchema>>();

    return (
      <>
        <FormField
          name="request.value.username"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel showRequiredIndicator>
                {authProperty.username.displayName}
              </FormLabel>
              <FormControl>
                <SecretInput {...field} type="text" />
              </FormControl>
              <FormDescription>
                {authProperty.username.description}
              </FormDescription>
            </FormItem>
          )}
        ></FormField>
        <FormField
          name="request.value.password"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-col mt-3.5">
              <FormLabel showRequiredIndicator>
                {authProperty.password.displayName}
              </FormLabel>
              <FormControl>
                <SecretInput {...field} type="password" />
              </FormControl>
              <FormDescription>
                {authProperty.password.description}
              </FormDescription>
            </FormItem>
          )}
        ></FormField>
      </>
    );
  },
);

BasicAuthConnectionSettings.displayName = 'BasicAuthConnectionSettings';
export { BasicAuthConnectionSettings };
