import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioApi } from '../../../common/api';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';

export const updateAppEmailConfigurationAction = createAction({
  auth: podioAuth,
  name: 'podio_update_app_email_configuration',
  displayName: 'Update App Email Configuration',
  description: 'Changes how emails sent to an app become items.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes the email-to-item configuration of one Podio app: whether attachments are kept and which app field receives the subject, body, contact or sender. A setting left unset keeps its current value; Field Mappings, when set, replaces all mappings. The app id comes from List Apps, the field ids from Get App.',
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app, from List Apps or Get App.' }),
    attachments: podioAiProps.bool({ required: false, displayName: 'Keep Attachments', description: '"true" adds email attachments to the item.' }),
    mappings: podioAiProps.json({
      required: false,
      displayName: 'Field Mappings',
      description: 'The full mapping of app field id to email part, each "subject", "body", "contact" or "sender", e.g. {"123456": "subject", "123457": "body"}. Replaces all current mappings.',
    }),
  },
  async run({ auth, propsValue }) {
    const attachments = podioUtils.toBool({ value: propsValue.attachments });
    const mappings = propsValue.mappings && Object.keys(propsValue.mappings).length > 0 ? propsValue.mappings : undefined;
    if (attachments === undefined && mappings === undefined) {
      throw new Error('Set attachments or mappings.');
    }
    const path = `/email/app/${propsValue.appId}`;
    const current = await podioApi.getAppEmailConfiguration({ auth, appId: propsValue.appId });
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.PUT,
      path,
      body: { attachments: attachments ?? current.attachments, mappings: mappings ?? current.mappings },
    });
  },
});
