import { createAction, Property } from '@activepieces/pieces-framework';
import { esignaturesAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createContract = createAction({
  auth: esignaturesAuth,
  name: 'createContract',
  displayName: 'Create Contract',
  description: 'Create a new contract from a template in eSignatures',
  props: {
    templateId: Property.ShortText({
      displayName: 'Template ID',
      description: 'The ID of the template to use for the contract',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Contract Title',
      description:
        'Unique title for the contract (defaults to template title if not specified)',
      required: false,
    }),
    locale: Property.StaticDropdown({
      displayName: 'Language',
      description: 'Language setting for the signer page and emails',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Czech', value: 'cz' },
          { label: 'Danish', value: 'da' },
          { label: 'German', value: 'de' },
          { label: 'Greek', value: 'el' },
          { label: 'English', value: 'en' },
          { label: 'English (UK)', value: 'en-GB' },
          { label: 'Spanish', value: 'es' },
          { label: 'Finnish', value: 'fi' },
          { label: 'French', value: 'fr' },
          { label: 'Croatian', value: 'hr' },
          { label: 'Hungarian', value: 'hu' },
          { label: 'Indonesian', value: 'id' },
          { label: 'Italian', value: 'it' },
          { label: 'Japanese', value: 'ja' },
          { label: 'Dutch', value: 'nl' },
          { label: 'Norwegian', value: 'no' },
          { label: 'Polish', value: 'pl' },
          { label: 'Portuguese', value: 'pt' },
          { label: 'Romanian', value: 'ro' },
          { label: 'Serbian', value: 'rs' },
          { label: 'Slovak', value: 'sk' },
          { label: 'Slovenian', value: 'sl' },
          { label: 'Swedish', value: 'sv' },
          { label: 'Vietnamese', value: 'vi' },
          { label: 'Chinese (Simplified)', value: 'zh-CN' },
        ],
      },
    }),
    metadata: Property.ShortText({
      displayName: 'Metadata',
      description: 'Custom data to attach to the contract',
      required: false,
    }),
    expiresInHours: Property.Number({
      displayName: 'Expires In Hours',
      description: 'Sets the expiry time (in hours) for the contract',
      required: false,
    }),
    customWebhookUrl: Property.ShortText({
      displayName: 'Custom Webhook URL',
      description: 'Custom URL for webhook notifications',
      required: false,
    }),
    assignedUserEmail: Property.ShortText({
      displayName: 'Assigned User Email',
      description: 'Email to assign management of the contract',
      required: false,
    }),
    labels: Property.Array({
      displayName: 'Labels',
      description: 'Labels to assign to the contract (for grouping)',
      required: false,
    }),
    test: Property.Checkbox({
      displayName: 'Test Contract',
      description: 'Mark as test/demo contract with no fees charged',
      required: false,
    }),
    saveAsDraft: Property.Checkbox({
      displayName: 'Save as Draft',
      description: 'Save as draft instead of sending to signers',
      required: false,
    }),
    signers: Property.Array({
      displayName: 'Signers',
      description:
        'List of individuals required to sign (name, email, and/or mobile)',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const payload: any = {
      template_id: propsValue.templateId,
    };

    if (propsValue.title) payload.title = propsValue.title;
    if (propsValue.locale) payload.locale = propsValue.locale;
    if (propsValue.metadata) payload.metadata = propsValue.metadata;
    if (propsValue.expiresInHours !== undefined)
      payload.expires_in_hours = propsValue.expiresInHours.toString();
    if (propsValue.customWebhookUrl)
      payload.custom_webhook_url = propsValue.customWebhookUrl;
    if (propsValue.assignedUserEmail)
      payload.assigned_user_email = propsValue.assignedUserEmail;
    if (propsValue.labels) payload.labels = propsValue.labels;
    if (propsValue.test !== undefined)
      payload.test = propsValue.test ? 'yes' : 'no';
    if (propsValue.saveAsDraft !== undefined)
      payload.save_as_draft = propsValue.saveAsDraft ? 'yes' : 'no';
    if (propsValue.signers) payload.signers = propsValue.signers;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://esignatures.com/api/contracts?token=${auth.secret_text}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload,
    });

    return response.body;
  },
});
