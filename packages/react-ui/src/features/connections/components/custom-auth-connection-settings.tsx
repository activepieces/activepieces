import React, { useEffect, useState } from 'react';
import { CustomAuthProperty } from '@activepieces/pieces-framework';
import {
    AppConnectionType,
    UpsertCustomAuthRequest,
} from '@activepieces/shared';
import { AutoPropertiesFormComponent } from '@/app/builder/step-settings/piece-settings/auto-properties-form';
import { authenticationSession } from '@/lib/authentication-session';
import { Static, Type } from '@sinclair/typebox';
import { typeboxResolver } from '@hookform/resolvers/typebox';
import { set, useForm } from 'react-hook-form';
import { appConnectionUtils } from '../lib/app-connections-utils';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

type CustomAuthConnectionSettingsProps = {
    onChange: (request: UpsertCustomAuthRequest | null, valid: boolean) => void;
    connectionName?: string;
    pieceName: string;
    authProperty: CustomAuthProperty<any>;
};

const formSchema = Type.Object({
    connectionName: Type.String({
        errorMessage: 'This field is required',
        minLength: 1,
    })
});
type FormSchema = Static<typeof formSchema>;


const CustomAuthConnectionSettings = React.memo(
    ({
        onChange,
        connectionName,
        pieceName,
        authProperty,
    }: CustomAuthConnectionSettingsProps) => {

        const suggestedConnectionName =
            connectionName ?? appConnectionUtils.findName(pieceName);

        const [autoformValid, setAutoformValid] = useState(false);
        const [propsValue, setPropsValue] = useState<Record<string, unknown>>({});
        const form = useForm<FormSchema>({
            defaultValues: {
                connectionName: suggestedConnectionName,
            },
            resolver: typeboxResolver(formSchema),
        });


        async function updateFormValue(value: Record<string, unknown>, isValid: boolean) {
            setAutoformValid(isValid);
            setPropsValue(value);
            console.log("FORM VALUe");
        }

        const watchedForm = form.watch();
        useEffect(() => {
            console.log(watchedForm)
        }, [watchedForm]);

        async function updateRequest() {
            const { connectionName } = form.getValues();
            const isValid = form.formState.isValid && autoformValid;
            onChange({
                name: connectionName,
                pieceName,
                projectId: authenticationSession.getProjectId(),
                type: AppConnectionType.CUSTOM_AUTH,
                value: {
                    type: AppConnectionType.CUSTOM_AUTH,
                    props: propsValue
                },
            }, isValid);
        }

        return (
            <>
                <Form {...form}>
                    <FormField
                        name="connectionName"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <div className="text-md font-medium">Connection Name</div>
                                <Input
                                    {...field}
                                    type="text"
                                    placeholder="Connection name"
                                />
                                <FormMessage />
                            </FormItem>
                        )}
                    ></FormField>
                </Form>
                <div className='mt-4'>
                    <AutoPropertiesFormComponent
                        props={authProperty.props}
                        allowDynamicValues={false}
                        renderSecretTextDescription={true}
                        renderSecretText={true}
                        onChange={updateFormValue}
                    />
                </div>
            </>


        );
    },
);

CustomAuthConnectionSettings.displayName = 'CustomAuthConnectionSettings';
export { CustomAuthConnectionSettings };