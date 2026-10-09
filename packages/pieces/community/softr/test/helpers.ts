import {
	ActionContext,
	AppConnectionType,
	AppConnectionValueForAuthProperty,
	AuthValidationServerContext,
	createMockActionContext,
	InputPropertyMap,
	SecretTextProperty,
	StaticPropsValue,
} from '@activepieces/pieces-framework';

export const TEST_AUTH: SecretTextConnection = { type: AppConnectionType.SECRET_TEXT, secret_text: 'softr_test_key' };

export function runAction({ action, propsValue }: RunActionParams): Promise<unknown> {
	const base = createMockActionContext<InputPropertyMap>({ propsValue });
	const context: SoftrActionContext = { ...base, auth: TEST_AUTH };
	return action.run(context);
}

export function authValidationServerContext(): AuthValidationServerContext {
	const { apiUrl, publicUrl } = createMockActionContext<InputPropertyMap>({ propsValue: {} }).server;
	return { apiUrl, publicUrl, mintOidcToken: async () => 'test-oidc-token' };
}

type SecretTextConnection = AppConnectionValueForAuthProperty<SecretTextProperty<true>>;

type SoftrActionContext = ActionContext<SecretTextProperty<true>, InputPropertyMap>;

export type TestAction = {
	run(context: SoftrActionContext): Promise<unknown>;
};

type RunActionParams = {
	action: TestAction;
	propsValue: StaticPropsValue<InputPropertyMap>;
};
