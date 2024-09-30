import { Static, Type } from '@sinclair/typebox';
import React from 'react';
import { useFormContext } from 'react-hook-form';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SecretTextProperty } from '@activepieces/pieces-framework';
import { UpsertSecretTextRequest } from '@activepieces/shared';

type SecretTextConnectionSettingsProps = {
  authProperty: SecretTextProperty<boolean>;
};

const SecretTextConnectionSettings = React.memo(
  ({ authProperty }: SecretTextConnectionSettingsProps) => {
    const formSchema = Type.Object({
      request: UpsertSecretTextRequest,
    });

    const form = useFormContext<Static<typeof formSchema>>();

    return (
      <FormField
        name="request.value.secret_text"
        control={form.control}
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>{authProperty.displayName}</FormLabel>
            <FormControl>
              <Input {...field} type="password" />
            </FormControl>
          </FormItem>
        )}
      ></FormField>
    );
  },
);

SecretTextConnectionSettings.displayName = 'SecretTextConnectionSettings';
export { SecretTextConnectionSettings };
