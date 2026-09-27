import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typeformAuth } from '../auth';
import { typeformCommon, TypeformRecord } from '../common';

export const updateFormMessagesAction = createAction({
  auth: typeformAuth,
  name: 'update_form_messages',
  classification: 'WRITE',
  displayName: 'Update Form Messages',
  description: 'Changes button labels, error messages and other texts of a form.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Change some of the interface texts of a Typeform form. Send only the keys to change, as a JSON object like {"label.button.submit":"Send"}; keys come from Get Form Messages and the other texts stay as they are. Plain text only, no HTML. Returns all messages after the change.',
    idempotent: true,
  },
  props: {
    form_id: typeformCommon.formId,
    messages: Property.Json({
      displayName: 'Messages',
      description: 'JSON object of message keys and their new text.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { form_id, messages } = propsValue;
    if (!typeformCommon.isRecord(messages) || Object.keys(messages).length === 0) {
      throw new Error('Messages must be a JSON object with at least one key.');
    }
    const path = `/forms/${encodeURIComponent(form_id)}/messages`;
    const current = await typeformCommon.typeformRequest<TypeformRecord>({
      token: auth.access_token,
      method: HttpMethod.GET,
      path,
    });
    const merged = { ...current, ...messages };
    await typeformCommon.typeformRequest<unknown>({
      token: auth.access_token,
      method: HttpMethod.PUT,
      path,
      body: merged,
    });
    return merged;
  },
});
