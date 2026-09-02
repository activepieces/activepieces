import { pollingHelper } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { formioAuth } from '../auth';
import {
  FormioActionMethod,
  FormioSubmission,
  formioCommon,
} from '../common/client';
import { submissionTriggerOutputSchema } from '../common/output-schemas';
import { formioProps } from '../common/props';
import { submissionPolling, SubmissionTimestamp } from './submission-polling';

function submissionFromWebhook(body: unknown): FormioSubmission | undefined {
  if (typeof body !== 'object' || body === null || !('submission' in body)) {
    return undefined;
  }
  const { submission } = body;
  if (typeof submission !== 'object' || submission === null) {
    return undefined;
  }
  if (!('_id' in submission) || !('data' in submission)) {
    return undefined;
  }
  return submission as FormioSubmission;
}

export function registerSubmissionTrigger({
  name,
  displayName,
  description,
  aiDescription,
  events,
  timestampField,
}: {
  name: string;
  displayName: string;
  description: string;
  aiDescription: string;
  events: FormioActionMethod[];
  timestampField: SubmissionTimestamp;
}) {
  const polling = submissionPolling(timestampField);
  const storeKey = `formio_${name}`;

  return createTrigger({
    auth: formioAuth,
    name,
    displayName,
    description,
    aiMetadata: { description: aiDescription },
    props: { formPath: formioProps.formPath },
    type: TriggerStrategy.WEBHOOK,
    outputSchema: submissionTriggerOutputSchema,
    sampleData: SAMPLE_SUBMISSION,

    async onEnable(context) {
      const stale = await context.store.get<WebhookRegistration>(storeKey);
      if (stale) {
        try {
          await formioCommon.deleteWebhookAction({
            auth: context.auth.props,
            formId: stale.formId,
            actionId: stale.actionId,
          });
        } catch (error) {
          await context.store.delete(storeKey);
        }
        await context.store.delete(storeKey);
      }

      const formId = await formioCommon.findFormId({
        auth: context.auth.props,
        formPath: context.propsValue.formPath,
      });

      const actionId = await formioCommon.createWebhookAction({
        auth: context.auth.props,
        formId,
        webhookUrl: context.webhookUrl,
        events,
      });

      await context.store.put<WebhookRegistration>(storeKey, {
        formId,
        actionId,
      });
    },

    async onDisable(context) {
      const registration = await context.store.get<WebhookRegistration>(
        storeKey
      );
      if (!registration) {
        return;
      }
      await formioCommon.deleteWebhookAction({
        auth: context.auth.props,
        formId: registration.formId,
        actionId: registration.actionId,
      });
      await context.store.delete(storeKey);
    },

    async run(context) {
      const submission = submissionFromWebhook(context.payload.body);
      return submission ? [submission] : [];
    },

    async test(context) {
      return await pollingHelper.test(polling, {
        auth: context.auth,
        propsValue: context.propsValue,
        store: context.store,
        files: context.files,
      });
    },
  });
}

export const SAMPLE_SUBMISSION = {
  _id: '6a97e02d2a5c0ca5c20b1ab9',
  form: '6a97df802a5c0ca5c20b1a2d',
  data: {
    fullName: 'Amina Haddad',
    email: 'amina@example.gov',
    category: 'permit',
  },
  owner: null,
  roles: [],
  access: [],
  externalIds: [],
  metadata: {
    headers: {
      host: 'forms.example.gov',
      'user-agent': 'Mozilla/5.0',
      'content-type': 'application/json',
    },
  },
  created: '2026-09-02T08:37:01.278Z',
  modified: '2026-09-02T08:37:01.279Z',
};

export type WebhookRegistration = {
  formId: string;
  actionId: string;
};
