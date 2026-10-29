import {
	ActionContext,
	AppConnectionType,
	AppConnectionValueForAuthProperty,
	createMockActionContext,
	InputPropertyMap,
	StaticPropsValue,
} from '@activepieces/pieces-framework';
import { TeableAuth } from '../src/lib/auth';

export const PAT_AUTH: TeableConnectionValue = {
	type: AppConnectionType.CUSTOM_AUTH,
	props: { token: 'teable_test_token', baseUrl: undefined },
};

export function patAuthWithBaseUrl(baseUrl: string): TeableConnectionValue {
	return {
		type: AppConnectionType.CUSTOM_AUTH,
		props: { token: 'teable_test_token', baseUrl },
	};
}

export function runAction({ action, propsValue, auth }: RunActionParams): Promise<unknown> {
	const base = createMockActionContext<InputPropertyMap>({ propsValue });
	const context: TeableActionContext = { ...base, auth: auth ?? PAT_AUTH };
	return action.run(context);
}

export type TeableConnectionValue = AppConnectionValueForAuthProperty<
	(typeof TeableAuth)[number]
>;

type TeableActionContext = ActionContext<(typeof TeableAuth)[number], InputPropertyMap>;

export type TestAction = {
	run(context: TeableActionContext): Promise<unknown>;
};

type RunActionParams = {
	action: TestAction;
	propsValue: StaticPropsValue<InputPropertyMap>;
	auth?: TeableConnectionValue;
};
