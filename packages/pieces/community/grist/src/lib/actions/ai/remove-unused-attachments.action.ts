import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gristAuth } from '../../auth';
import { GristAPIClient } from '../../common/helpers';
import { commonProps } from '../../common/props';
import { gristDeleteColumnOutputSchema } from '../../output-schemas';

export const gristRemoveUnusedAttachmentsAction = createAction({
  auth: gristAuth,
  name: 'grist_remove_unused_attachments',
  outputSchema: gristDeleteColumnOutputSchema,
  displayName: 'Remove Unused Attachments',
  description: 'Deletes attachments that no cell references.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes ALL attachments in a document that no Attachments cell references (it cannot target one attachment). To delete a specific file, first clear its cell with **Update Records**, then run this. Repeating it is harmless.',
    idempotent: true,
  },
  props: {
    documentId: commonProps.document_id_text,
    expiredOnly: Property.Checkbox({
      displayName: 'Expired Only',
      description:
        'Only remove attachments unreferenced for longer than the server retention period.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const client = new GristAPIClient({
      domainUrl: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
    });
    const { documentId, expiredOnly } = context.propsValue;
    await client.makeRequest(
      HttpMethod.POST,
      `/docs/${documentId}/attachments/removeUnused`,
      undefined,
      { expiredOnly: expiredOnly ? 'true' : undefined }
    );
    return { success: true };
  },
});
