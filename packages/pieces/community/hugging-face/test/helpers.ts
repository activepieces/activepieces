import { Readable } from 'node:stream';
import {
  ActionContext,
  AppConnectionType,
  InputPropertyMap,
  SecretTextProperty,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import { createMockActionContext } from '../../../framework/src/lib/test';

export function runAction<Props extends InputPropertyMap>({ action, propsValue }: RunActionParams<Props>) {
  const context: ActionContext<SecretTextProperty<true>, Props> = {
    ...createMockActionContext<Props>({ propsValue }),
    auth: { type: AppConnectionType.SECRET_TEXT, secret_text: TEST_TOKEN },
  };
  return action.run(context);
}

export function streamOf(content: string | Buffer): Readable {
  return Readable.from([typeof content === 'string' ? Buffer.from(content) : content]);
}

export const TEST_TOKEN = 'hf_test_connection_token';

type RunActionParams<Props extends InputPropertyMap> = {
  action: {
    props: Props;
    run: (context: ActionContext<SecretTextProperty<true>, Props>) => Promise<unknown>;
  };
  propsValue: StaticPropsValue<Props>;
};
