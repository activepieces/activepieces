import { Static, Type } from '@sinclair/typebox';
import React from 'react';
import { useFormContext } from 'react-hook-form';

import { FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SecretTextProperty } from '@activepieces/pieces-framework';
import { UpsertSecretTextRequest } from '@activepieces/shared';

type SecretTextConnectionSettingsProps = {
  authProperty: SecretTextProperty<boolean>;
};

const SecretTextConnectionSettings = React.memo(
  ({ authProperty }: SecretTextConnectionSettingsProps) => {
    const forSchema = Type.Object({
      request: UpsertSecretTextRequest,
    });

    const form = useFormContext<Static<typeof forSchema>>();

    return (
      <FormField
        name="request.value.secret_text"
        control={form.control}
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <Label htmlFor="secret_text">{authProperty.displayName}</Label>
            <Input
              {...field}
              onChange={(e) => {
                field.onChange(e);
              }}
              type="password"
            />
            <FormMessage />
          </FormItem>
        )}
      ></FormField>
    );
  },
);

SecretTextConnectionSettings.displayName = 'SecretTextConnectionSettings';
export { SecretTextConnectionSettings };
