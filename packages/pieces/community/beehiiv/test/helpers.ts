import {
    ActionContext,
    AppConnectionType,
    AppConnectionValueForAuthProperty,
    createMockActionContext,
    InputPropertyMap,
    SecretTextProperty,
    StaticPropsValue,
} from '@activepieces/pieces-framework';

export const TEST_AUTH: SecretTextConnection = { type: AppConnectionType.SECRET_TEXT, secret_text: 'bh_test' };

export function runAction({ action, propsValue }: RunActionParams): Promise<unknown> {
    const base = createMockActionContext<InputPropertyMap>({ propsValue });
    const context: BeehiivActionContext = { ...base, auth: TEST_AUTH };
    return action.run(context);
}

type SecretTextConnection = AppConnectionValueForAuthProperty<SecretTextProperty<true>>;

type BeehiivActionContext = ActionContext<SecretTextProperty<true>, InputPropertyMap>;

export type TestAction = {
    run(context: BeehiivActionContext): Promise<unknown>;
};

type RunActionParams = {
    action: TestAction;
    propsValue: StaticPropsValue<InputPropertyMap>;
};
