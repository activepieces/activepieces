import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../../auth';
import { kitClient, kitCommon } from '../../common/client';
import { kitProps } from '../../common/ai-props';
import { kitDeleteWebhookOutputSchema } from '../../output-schemas';

export const kitDeleteWebhook = createAction({
  auth: convertkitAuth,
  name: 'kit_delete_webhook',
  classification: 'DESTRUCTIVE',
  outputSchema: kitDeleteWebhookOutputSchema,
  displayName: 'Delete Webhook',
  description: 'Delete a webhook automation by its rule ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes a webhook rule by its rule ID, from Create Webhook or List Webhooks. Kit stops calling the target URL immediately. A repeat call fails once the rule is gone.',
    idempotent: false,
  },
  props: {
    rule_id: kitProps.id('Rule ID', 'The webhook rule ID, from Create Webhook or List Webhooks.'),
  },
  async run(context) {
    const ruleId = kitCommon.id({ value: context.propsValue.rule_id, label: 'Rule ID' });
    const response = await kitClient.request<{ success?: boolean }>({
      apiSecret: context.auth.secret_text,
      method: HttpMethod.DELETE,
      path: `/automations/hooks/${ruleId}`,
    });
    return { success: response.body?.success ?? true, rule_id: ruleId };
  },
});
