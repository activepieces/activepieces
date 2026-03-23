import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { youformAuth } from '../common/auth';
import { formIdDropdown } from '../common/props';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { BASE_URL } from '../common/constants';
import { CreateWebhookResponse } from '../common/types';
import { isNil } from '@activepieces/shared';

const TRIGGER_KEY = 'youform-new-submission-trigger';

export const newSubmissionTrigger = createTrigger({
  name: 'new-submission',
  auth: youformAuth,
  displayName: 'New Submission',
  description: 'Triggers When a new submission is recieved.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    formId: formIdDropdown,
  },
  async onEnable(context) {
    const { formId } = context.propsValue;

    const response = await httpClient.sendRequest<CreateWebhookResponse>({
      method: HttpMethod.POST,
      url: BASE_URL + '/webhooks',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      body:{},
      queryParams: {
        form_id: formId.toString(),
        webhook_url: context.webhookUrl,
      },
    });

    const webhookId = response.body.data.id;

    await context.store.put<number>(TRIGGER_KEY, webhookId);
  },
  async onDisable(context) {
    const webhookId = await context.store.get<number>(TRIGGER_KEY);

    if (!isNil(webhookId)) {
      await httpClient.sendRequest<CreateWebhookResponse>({
        method: HttpMethod.DELETE,
        url: BASE_URL + `/webhooks/${webhookId}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.secret_text,
        },
      });
    }
  },
  async run(context) {
    return [context.payload.body];
  },
  async test(context) {
    return [context.payload.body];
  },
  sampleData: undefined,
});
