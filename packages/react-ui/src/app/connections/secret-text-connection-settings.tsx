import { SecretTextProperty } from '@activepieces/pieces-framework';
import { UpsertSecretTextRequest } from '@activepieces/shared';
import { Static, Type } from '@sinclair/typebox';
import React from 'react';
import { useFormContext } from 'react-hook-form';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';


import { SecretInput } from './secret-input';

type SecretTextConnectionSettingsProps = {
  authProperty: SecretTextProperty<boolean>;
  isGlobalConnection: boolean;
};

const SecretTextConnectionSettings = React.memo(
  ({ authProperty, isGlobalConnection }: SecretTextConnectionSettingsProps) => {
    const formSchema = Type.Object({
      request: UpsertSecretTextRequest,
    });

    const form = useFormContext<Static<typeof formSchema>>();

    return (
      <FormField
        name="request.value.secret_text"
        control={form.control}
        render={({ field }) => (
          <FormItem className="flex flex-col gap-2">
            <FormLabel>{authProperty.displayName}</FormLabel>
            <FormControl>
              <SecretInput
                {...field}
                type="password"
                allowTogglingSecretManagerMode={isGlobalConnection}
              />
            </FormControl>
          </FormItem>
        )}
      ></FormField>
    );
  },
);

SecretTextConnectionSettings.displayName = 'SecretTextConnectionSettings';
export { SecretTextConnectionSettings };
