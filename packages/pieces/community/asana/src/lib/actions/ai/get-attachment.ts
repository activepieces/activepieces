import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaAttachmentOutputSchema } from '../../output-schemas';

export const asanaGetAttachmentAction = createAction({
  auth: asanaAuth,
  name: 'get_attachment',
  classification: 'READ',
  displayName: 'Get Attachment',
  description: 'Get an Asana attachment and its download link.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one attachment: name, size, host, parent and its download, view and permanent URLs. The download_url is short-lived, so fetch it right before downloading. Use List Attachments to find attachment gids on a task, project or project brief. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaAttachmentOutputSchema,
  props: {
    attachment: Property.ShortText({
      displayName: 'Attachment GID',
      description: 'Gid of the attachment. Obtain it from List Attachments.',
      required: true,
    }),
  },
  async run(context) {
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/attachments/${asanaUtils.pathSegment(context.propsValue.attachment)}`,
      operation: 'Get Attachment',
      query: { opt_fields: ASANA_FIELDS.attachment },
    });
  },
});
