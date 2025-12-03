import { opnformCommon, workspaceIdProp, formIdProp } from '../common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { opnformAuth } from '../..';

export const opnformNewSubmission = createTrigger({
  auth: opnformAuth,
  name: 'new_submission',
  displayName: 'New Submission',
  description: 'Triggers when Opnform receives a new submission.',
  props: {
    workspaceId: workspaceIdProp,
    formId: formIdProp,
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    form_title: "My Form",
    form_slug: "my-form-vuep24",
    data: {
      "6cc0dcf4-0ca8-43e4-b31a-b3f3413f859a": {
        value: "This is test",
        name: "Name"
      },
      "6e171bce-3eab-47a4-a289-20a0cb8ec693": {
        value: "abc@example.com",
        name: "Email"
      }
    }
  },
  async onEnable(context) {
    const formId = context.propsValue['formId'];
    const webhookUrl = context.webhookUrl;
    if (!formId) {
      throw new Error('Form is required');
    }
      
    const flowUrl = `${new URL(context.server.publicUrl).origin}/projects/${context.project.id}/flows/${context.flows.current.id}`;
      
    const integrationId = await opnformCommon.createOrUpdateIntegration(
      context.auth,
      formId,
      webhookUrl,
      flowUrl
    );
    if (integrationId) {
      await context.store?.put<WebhookInformation>('_new_submission_trigger', {
        integrationId: integrationId as number,
      });
    } else {
      throw new Error('Failed to create integration');
    }
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>(
      '_new_submission_trigger'
    );
    if (response !== null && response !== undefined && response.integrationId) {
      const formId = context.propsValue['formId'];
      if (!formId) {
        throw new Error('Form is required');
      }
      await opnformCommon.deleteIntegration(
        context.auth,
        formId,
        response.integrationId
      );
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});

interface WebhookInformation {
  integrationId: number;
}
