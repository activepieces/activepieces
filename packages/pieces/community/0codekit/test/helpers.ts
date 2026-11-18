import {
    ActionContext,
    AppConnectionType,
    AppConnectionValueForAuthProperty,
    AuthValidationServerContext,
    createMockActionContext,
    FilesService,
    InputPropertyMap,
    PropertyContext,
    SecretTextProperty,
    StaticPropsValue,
} from '@activepieces/pieces-framework';

export const TEST_AUTH: SecretTextConnection = { type: AppConnectionType.SECRET_TEXT, secret_text: 'zck_test' };

export function runAction({ action, propsValue, write }: RunActionParams): Promise<unknown> {
    const base = createMockActionContext<InputPropertyMap>({ propsValue });
    const context: ZeroCodeKitActionContext = {
        ...base,
        auth: TEST_AUTH,
        files: write ? { ...base.files, write } : base.files,
    };
    return action.run(context);
}

export function loadDropdownOptions({ dropdown, auth }: LoadDropdownOptionsParams): Promise<unknown> {
    return dropdown.options({ auth }, propertyContext());
}

export function authValidationServerContext(): AuthValidationServerContext {
    const { apiUrl, publicUrl } = createMockActionContext<InputPropertyMap>({ propsValue: {} }).server;
    return { apiUrl, publicUrl, mintOidcToken: async () => 'test-oidc-token' };
}

function propertyContext(): PropertyContext {
    const { server, project, flows, connections } = createMockActionContext<InputPropertyMap>({ propsValue: {} });
    return { server, project, flows, connections };
}

type SecretTextConnection = AppConnectionValueForAuthProperty<SecretTextProperty<true>>;

type ZeroCodeKitActionContext = ActionContext<SecretTextProperty<true>, InputPropertyMap>;

export type TestAction = {
    run(context: ZeroCodeKitActionContext): Promise<unknown>;
};

type RunActionParams = {
    action: TestAction;
    propsValue: StaticPropsValue<InputPropertyMap>;
    write?: FilesService['write'];
};

type LoadDropdownOptionsParams = {
    dropdown: {
        options(propsValue: { auth?: SecretTextConnection }, ctx: PropertyContext): Promise<unknown>;
    };
    auth: SecretTextConnection | undefined;
};
