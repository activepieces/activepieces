import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { formioAuth } from '../auth';
import {
  FormioActionMethod,
  FormioWebhookPayload,
  formioCommon,
} from '../common/client';
import { formioProps } from '../common/props';

type FormioAuthValue = AppConnectionValueForAuthProperty<typeof formioAuth>;

const polling = (
  timestampField: 'created' | 'modified'
): Polling<FormioAuthValue, { formPath: string }> => ({
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const queryParams: Record<string, string> = {
      sort: `-${timestampField}`,
      limit: '50',
    };
    if (lastFetchEpochMS) {
      queryParams[`${timestampField}__gt`] = new Date(
        lastFetchEpochMS
      ).toISOString();
    }

    const { submissions } = await formioCommon.findSubmissions({
      auth: auth.props,
      formPath: propsValue.formPath,
      queryParams,
    });

    return submissions.map((submission) => ({
      epochMilliSeconds: new Date(
        submission[timestampField] ?? submission.created ?? 0
      ).getTime(),
      data: submission,
    }));
  },
});

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
  timestampField: 'created' | 'modified';
}) {
  const submissionPolling = polling(timestampField);

  return createTrigger({
    auth: formioAuth,
    name,
    displayName,
    description,
    aiMetadata: { description: aiDescription },
    props: { formPath: formioProps.formPath },
    type: TriggerStrategy.WEBHOOK,
    sampleData: SAMPLE_SUBMISSION,

    async onEnable(context) {
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

      await context.store.put<WebhookRegistration>(`formio_${name}`, {
        formId,
        actionId,
      });
    },

    async onDisable(context) {
      const registration = await context.store.get<WebhookRegistration>(
        `formio_${name}`
      );
      if (!registration) {
        return;
      }
      await formioCommon.deleteWebhookAction({
        auth: context.auth.props,
        formId: registration.formId,
        actionId: registration.actionId,
      });
      await context.store.delete(`formio_${name}`);
    },

    async run(context) {
      const payload = context.payload.body as FormioWebhookPayload;
      const submission = payload?.submission;
      return submission ? [submission] : [];
    },

    async test(context) {
      return await pollingHelper.test(submissionPolling, {
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
