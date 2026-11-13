import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioApi } from '../../../common/api';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import type { PodioFormField } from '../../../common/types';

export const updateFormAction = createAction({
  auth: podioAuth,
  name: 'podio_update_form',
  displayName: 'Update Form',
  description: 'Changes the settings, domains or fields of a web form.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates a Podio web form: only the inputs you set change, the rest is kept from the current form. A Field IDs list replaces the form fields, keeping the settings of fields already on it. The form id comes from List Forms or Create Form and field ids from Get App.',
    idempotent: true,
  },
  props: {
    formId: podioAiProps.id({ required: true, displayName: 'Form ID', description: 'The id of the form, from List Forms or Create Form.' }),
    fieldIds: podioAiProps.idList({ required: false, displayName: 'Field IDs', description: 'The ids of the app fields to show on the form, in order, from Get App. Replaces the current fields.' }),
    submitText: podioAiProps.text({ required: false, displayName: 'Submit Button Text', description: 'The text of the submit button.' }),
    successText: podioAiProps.text({ required: false, displayName: 'Success Text', description: 'The text shown after a successful submission.' }),
    heading: podioAiProps.text({ required: false, displayName: 'Heading', description: 'A heading shown when the form is not embedded.' }),
    formDescription: podioAiProps.longText({ required: false, displayName: 'Description', description: 'An explanatory text shown when the form is not embedded.' }),
    theme: podioAiProps.text({ required: false, displayName: 'Theme', description: 'The name of a Podio form theme.' }),
    css: podioAiProps.longText({ required: false, displayName: 'CSS', description: 'Inline CSS to include in the form.' }),
    captcha: podioAiProps.bool({ required: false, displayName: 'Captcha', description: '"true" requires a captcha on submission.' }),
    attachments: podioAiProps.bool({ required: false, displayName: 'Allow Attachments', description: '"true" lets people attach files to their submission.' }),
    domains: podioAiProps.idList({ required: false, displayName: 'Domains', description: 'The domains the form may be embedded on, such as "example.com". Replaces the current domains.' }),
  },
  async run({ auth, propsValue }) {
    const p = propsValue;
    const path = `/form/${p.formId}`;
    const current = await podioApi.getForm({ auth, formId: p.formId });
    const body = {
      settings: {
        ...current.settings,
        ...podioUtils.body({ values: { captcha: podioUtils.toBool({ value: p.captcha }), theme: p.theme, css: p.css } }),
        text: {
          ...current.settings?.text,
          ...podioUtils.body({ values: { heading: p.heading, description: p.formDescription, submit: p.submitText, success: p.successText } }),
        },
      },
      domains: p.domains && p.domains.length > 0 ? p.domains : current.domains,
      fields: p.fieldIds && p.fieldIds.length > 0 ? mergeFields({ fieldIds: p.fieldIds, currentFields: current.fields ?? [] }) : current.fields,
      attachments: podioUtils.toBool({ value: p.attachments }) ?? current.attachments,
    };
    return await podioClient.request<unknown>({ auth, method: HttpMethod.PUT, path, body });
  },
});

function mergeFields({ fieldIds, currentFields }: { fieldIds: unknown[]; currentFields: PodioFormField[] }): PodioFormField[] {
  return fieldIds.map((fieldId) => currentFields.find((field) => String(field.field_id) === String(fieldId)) ?? { field_id: Number(fieldId) });
}
