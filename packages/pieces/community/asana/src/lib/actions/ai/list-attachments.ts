import { createAction, Property } from '@activepieces/pieces-framework';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps } from '../../common/client';
import { asanaAttachmentListOutputSchema } from '../../output-schemas';

export const asanaListAttachmentsAction = createAction({
  auth: asanaAuth,
  name: 'list_attachments',
  classification: 'SEARCH',
  displayName: 'List Attachments',
  description: 'List the attachments on an Asana task, project or project brief.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the files attached to a task, to a project (its Key resources) or to a project brief, with names, sizes and download links. Inline images in a task description are not included. Use Get Attachment for a fresh download_url on one file. Paginated with next_offset; read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaAttachmentListOutputSchema,
  props: {
    parent: Property.ShortText({
      displayName: 'Parent GID',
      description: 'Gid of the task, project or project brief whose attachments to list. Obtain a task gid from List Project Tasks or Get Task.',
      required: true,
    }),
    limit: asanaProps.limit({ noun: 'attachments' }),
    offset: asanaProps.offset(),
  },
  async run(context) {
    const { parent, limit, offset } = context.propsValue;
    return asanaClient.asanaListPage<AsanaRecord>({
      auth: context.auth,
      path: '/attachments',
      operation: 'List Attachments',
      query: { parent: parent.trim(), opt_fields: ASANA_FIELDS.attachment },
      limit,
      offset,
    });
  },
});
