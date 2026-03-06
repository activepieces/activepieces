import { BasicAuthProperty } from '@activepieces/pieces-framework';
import { UpsertBasicAuthRequest } from '@activepieces/shared';
import { Static, Type } from '@sinclair/typebox';
import React from 'react';
import { useFormContext } from 'react-hook-form';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { authenticationSession } from '@/lib/authentication-session';

import { SecretInput } from './secret-input';

type BasicAuthConnectionSettingsProps = {
  authProperty: BasicAuthProperty;
  isGlobalConnection: boolean;
};

const BasicAuthConnectionSettings = React.memo(
  ({ authProperty, isGlobalConnection }: BasicAuthConnectionSettingsProps) => {
    const forSchema = Type.Object({
      request: UpsertBasicAuthRequest,
    });
    const form = useFormContext<Static<typeof forSchema>>();
    const projectId = isGlobalConnection
      ? undefined
      : authenticationSession.getProjectId()!;

    return (
      <>
        <FormField
          name="request.value.username"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{authProperty.username.displayName}</FormLabel>
              <FormControl>
                <SecretInput {...field} type="text" projectId={projectId} />
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
              <FormLabel>{authProperty.password.displayName}</FormLabel>
              <FormControl>
                <SecretInput {...field} type="password" projectId={projectId} />
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
