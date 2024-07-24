import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import React from 'react';
import { useForm } from 'react-hook-form';

import { Form, FormDescription, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { appConnectionUtils } from '@/features/connections/lib/app-connections-utils';
import { authenticationSession } from '@/lib/authentication-session';
import { BasicAuthProperty } from '@activepieces/pieces-framework';
import {
  AppConnectionType,
  UpsertBasicAuthRequest,
} from '@activepieces/shared';

type BasicAuthConnectionSettingsProps = {
  onChange: (request: UpsertBasicAuthRequest | null, valid: boolean) => void;
  connectionName?: string;
  pieceName: string;
  authProperty: BasicAuthProperty;
};

const formSchema = Type.Object({
  connectionName: Type.String({
    errorMessage: 'This field is required',
    minLength: 1,
  }),
  username: Type.String({
    errorMessage: 'This field is required',
    minLength: 1,
  }),
  password: Type.String({
    errorMessage: 'This field is required',
    minLength: 1,
  }),
});

type FormSchema = Static<typeof formSchema>;

const BasicAuthConnectionSettings = React.memo(
  ({
    onChange,
    connectionName,
    pieceName,
    authProperty,
  }: BasicAuthConnectionSettingsProps) => {
    const suggestedConnectionName =
      connectionName ?? appConnectionUtils.findName(pieceName);

    const form = useForm<FormSchema>({
      defaultValues: {
        connectionName: suggestedConnectionName,
        username: '',
        password: '',
      },
      resolver: typeboxResolver(formSchema),
    });

    async function handleChange() {
      await form.trigger();
      const { username, password, connectionName } = form.getValues();
      onChange(
        {
          name: connectionName,
          pieceName,
          projectId: authenticationSession.getProjectId(),
          type: AppConnectionType.BASIC_AUTH,
          value: {
            type: AppConnectionType.BASIC_AUTH,
            username: username,
            password: password,
          },
        },
        form.formState.isValid,
      );
    }

    return (
      <Form {...form}>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => e.preventDefault()}
        >
          <FormField
            name="connectionName"
            control={form.control}
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <div className="text-md font-medium">Connection Name</div>
                <Input
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    form.trigger();
                  }}
                  type="text"
                  placeholder="Connection name"
                />
                <FormMessage />
              </FormItem>
            )}
          ></FormField>
          <FormField
            name="username"
            control={form.control}
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <Label htmlFor="username">{authProperty.username.displayName}</Label>
                <Input
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    handleChange();
                  }}
                  type="text"
                />
                <FormDescription>{authProperty.username.description}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          ></FormField>
          <FormField
            name="password"
            control={form.control}
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <Label htmlFor="password">{authProperty.password.displayName}</Label>
                <Input
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    handleChange();
                  }}
                  type="password"
                />
                <FormDescription>{authProperty.password.description}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          ></FormField>
        </form>
      </Form>
    );
  },
);

BasicAuthConnectionSettings.displayName = 'BasicAuthConnectionSettings';
export { BasicAuthConnectionSettings };
