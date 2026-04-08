import { SecretTextProperty } from '@activepieces/pieces-framework';
import { UpsertSecretTextRequest } from '@activepieces/shared';
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';

import { SecretInput } from './secret-input';

type SecretTextConnectionSettingsProps = {
  authProperty: SecretTextProperty<boolean>;
};

const SecretTextConnectionSettings = React.memo(
  ({ authProperty }: SecretTextConnectionSettingsProps) => {
    const formSchema = z.object({
      request: UpsertSecretTextRequest,
    });

    const form = useFormContext<z.infer<typeof formSchema>>();

    return (
      <FormField
        name="request.value.secret_text"
        control={form.control}
        render={({ field }) => (
          <FormItem className="flex flex-col gap-2">
            <FormLabel showRequiredIndicator>
              {authProperty.displayName}
            </FormLabel>
            <FormControl>
              <SecretInput {...field} type="password" />
            </FormControl>
          </FormItem>
        )}
      ></FormField>
    );
  },
);

SecretTextConnectionSettings.displayName = 'SecretTextConnectionSettings';
export { SecretTextConnectionSettings };
