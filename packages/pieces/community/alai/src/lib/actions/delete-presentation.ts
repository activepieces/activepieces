import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { alaiAuth } from '../common/auth';
import { alaiClient } from '../common/client';
import { alaiOutputSchemas } from '../common/output-schemas';
import { presentationIdProp } from './shared-props';

export const deletePresentation = createAction({
  auth: alaiAuth,
  name: 'deletePresentation',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Presentation',
  description: 'Permanently delete a presentation.',
  audience: 'both',
  outputSchema: alaiOutputSchemas.deletePresentation,
  aiMetadata: {
    description:
      'Permanently deletes an Alai presentation by its ID; this cannot be undone. Fails with a not-found error if the ID does not exist or was already deleted, so a repeated call errors.',
    idempotent: false,
  },
  props: {
    presentationId: presentationIdProp('The presentation to delete.'),
  },
  async run({ auth, propsValue }) {
    const presentationId = alaiClient.pathId({ value: propsValue.presentationId, label: 'Presentation ID' });
    const body = await alaiClient.request<{ success?: boolean; presentation_id?: string }>({
      apiKey: auth.props.apiKey,
      method: HttpMethod.DELETE,
      path: `/presentations/${presentationId}`,
    });
    if (body?.success === false) {
      throw new Error(`Alai did not delete presentation ${propsValue.presentationId}.`);
    }
    return { success: true, presentation_id: body?.presentation_id ?? propsValue.presentationId.trim() };
  },
});
