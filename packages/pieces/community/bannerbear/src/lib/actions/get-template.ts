import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bannerbearAuth } from '../auth';
import { bannerbearClient, RawTemplate } from '../common/client';
import { bannerbearOutputSchemas } from '../output-schemas';

export const getTemplateAction = createAction({
  auth: bannerbearAuth,
  name: 'get_template',
  classification: 'READ',
  displayName: 'Get Template',
  description: 'Get a template and its layer names.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch one Bannerbear image template by ID, including its layers (name and type). Call this before Create Image from JSON to know which layer names to modify. Read-only.',
    idempotent: true,
  },
  outputSchema: bannerbearOutputSchemas['template'],
  props: {
    template_uid: Property.ShortText({
      displayName: 'Template ID',
      description: 'The template UID, from List Templates.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const apiKey = auth.secret_text;
    const uid = propsValue.template_uid.trim();
    if (uid === '') throw new Error('Template ID is required.');
    const raw = await bannerbearClient.request<RawTemplate>({
      apiKey,
      method: HttpMethod.GET,
      path: bannerbearClient.templatePath({ apiKey, uid }),
    });
    return bannerbearClient.normalizeTemplate(raw);
  },
});
