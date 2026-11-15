import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioCreateFormOutputSchema } from '../../../output-schemas';

export const createFormAction = createAction({
  auth: podioAuth,
  name: 'podio_create_form',
  outputSchema: podioCreateFormOutputSchema,
  displayName: 'Create Form',
  description: 'Creates a web form that adds items to an app.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a Podio web form on an app; each submission creates an item in that app. Returns the new form id for Get Form, Update Form and the other form actions. The app id comes from List Apps and the field ids from Get App.',
    idempotent: false,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app the form adds items to, from List Apps or Get App.' }),
    fieldIds: podioAiProps.idList({ required: true, displayName: 'Field IDs', description: 'The ids of the app fields to show on the form, in order, from Get App.' }),
    submitText: podioAiProps.text({ required: false, displayName: 'Submit Button Text', description: 'The text of the submit button. Defaults to "Submit".' }),
    successText: podioAiProps.text({ required: false, displayName: 'Success Text', description: 'The text shown after a successful submission. Defaults to "Thank you".' }),
    heading: podioAiProps.text({ required: false, displayName: 'Heading', description: 'A heading shown when the form is not embedded.' }),
    formDescription: podioAiProps.longText({ required: false, displayName: 'Description', description: 'An explanatory text shown when the form is not embedded.' }),
    theme: podioAiProps.text({ required: false, displayName: 'Theme', description: 'The name of a Podio form theme. Defaults to "default".' }),
    css: podioAiProps.longText({ required: false, displayName: 'CSS', description: 'Inline CSS to include in the form.' }),
    captcha: podioAiProps.bool({ required: false, displayName: 'Captcha', description: '"true" requires a captcha on submission. Defaults to "false".' }),
    attachments: podioAiProps.bool({ required: false, displayName: 'Allow Attachments', description: '"true" lets people attach files to their submission.' }),
    domains: podioAiProps.idList({ required: false, displayName: 'Domains', description: 'The domains the form may be embedded on, such as "example.com". Defaults to none.' }),
  },
  async run({ auth, propsValue }) {
    const p = propsValue;
    const body = podioUtils.body({
      values: {
        settings: podioUtils.body({
          values: {
            captcha: podioUtils.toBool({ value: p.captcha }) ?? false,
            text: podioUtils.body({ values: { heading: p.heading, description: p.formDescription, submit: p.submitText ?? 'Submit', success: p.successText ?? 'Thank you' } }),
            theme: p.theme ?? 'default',
            css: p.css,
          },
        }),
        domains: p.domains ?? [],
        fields: p.fieldIds.map((fieldId) => ({ field_id: Number(fieldId) })),
        attachments: podioUtils.toBool({ value: p.attachments }),
      },
    });
    return await podioClient.request<unknown>({ auth, method: HttpMethod.POST, path: `/form/app/${p.appId}/`, body });
  },
});
