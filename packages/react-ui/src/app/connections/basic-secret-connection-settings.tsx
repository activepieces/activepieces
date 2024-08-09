import { Static, Type } from '@sinclair/typebox';
import React from 'react';
import { useFormContext } from 'react-hook-form';

import {
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BasicAuthProperty } from '@activepieces/pieces-framework';
import { UpsertBasicAuthRequest } from '@activepieces/shared';

type BasicAuthConnectionSettingsProps = {
  authProperty: BasicAuthProperty;
};

const BasicAuthConnectionSettings = React.memo(
  ({ authProperty }: BasicAuthConnectionSettingsProps) => {
    const forSchema = Type.Object({
      request: UpsertBasicAuthRequest,
    });
    const form = useFormContext<Static<typeof forSchema>>();

    return (
      <>
        <FormField
          name="request.value.username"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <Label htmlFor="username">
                {authProperty.username.displayName}
              </Label>
              <Input {...field} type="text" />
              <FormDescription>
                {authProperty.username.description}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        ></FormField>
        <FormField
          name="request.value.password"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <Label htmlFor="password">
                {authProperty.password.displayName}
              </Label>
              <Input {...field} type="password" />
              <FormDescription>
                {authProperty.password.description}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        ></FormField>
      </>
    );
  },
);

BasicAuthConnectionSettings.displayName = 'BasicAuthConnectionSettings';
export { BasicAuthConnectionSettings };
