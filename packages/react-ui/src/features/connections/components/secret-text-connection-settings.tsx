import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import React from 'react';
import { useForm } from 'react-hook-form';

import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { appConnectionUtils } from '@/features/connections/lib/app-connections-utils';
import { authenticationSession } from '@/lib/authentication-session';
import { SecretTextProperty } from '@activepieces/pieces-framework';
import {
  AppConnectionType,
  UpsertSecretTextRequest,
} from '@activepieces/shared';

type SecretTextConnectionSettingsProps = {
  onChange: (request: UpsertSecretTextRequest | null, valid: boolean) => void;
  connectionName?: string;
  pieceName: string;
  authProperty: SecretTextProperty<boolean>;
};

const formSchema = Type.Object({
  connectionName: Type.String({
    errorMessage: 'This field is required',
    minLength: 1,
  }),
  secret_text: Type.String({
    errorMessage: 'This field is required',
    minLength: 1,
  }),
});

type FormSchema = Static<typeof formSchema>;

const SecretTextConnectionSettings = React.memo(
  ({
    onChange,
    connectionName,
    pieceName,
    authProperty,
  }: SecretTextConnectionSettingsProps) => {
    const suggestedConnectionName =
      connectionName ?? appConnectionUtils.findName(pieceName);

    const form = useForm<FormSchema>({
      defaultValues: {
        connectionName: suggestedConnectionName,
        secret_text: '',
      },
      resolver: typeboxResolver(formSchema),
    });

    async function handleChange() {
      await form.trigger();
      const { secret_text, connectionName } = form.getValues();
      onChange(
        {
          name: connectionName,
          pieceName,
          projectId: authenticationSession.getProjectId(),
          type: AppConnectionType.SECRET_TEXT,
          value: {
            type: AppConnectionType.SECRET_TEXT,
            secret_text: secret_text,
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
            name="secret_text"
            control={form.control}
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <Label htmlFor="secret_text">{authProperty.displayName}</Label>
                <Input
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    handleChange();
                  }}
                  type="text"
                />
                <FormMessage />
              </FormItem>
            )}
          ></FormField>
        </form>
      </Form>
    );
  },
);

SecretTextConnectionSettings.displayName = 'SecretTextConnectionSettings';
export { SecretTextConnectionSettings };
