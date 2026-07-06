import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

export const detachTagAction = createAction({
  auth: simplyprintAuth,
  name: 'detach_tag',
  displayName: 'Detach Tag',
  description: 'Remove a single custom tag from one printer, printer group, file, or queue item.',
  audience: 'both',
  aiMetadata: { description: 'Detach one custom tag (by tag ID) from a single entity — choose the subject type (printer, printer group, file, or queue item) and give its ID. Pick it to untag an entity, not to delete the tag definition itself. Idempotent: detaching a tag not present is a no-op.', idempotent: true },
  props: {
    subjectType: Property.StaticDropdown<1 | 2 | 3 | 4>({
      displayName: 'Subject type',
      required: true,
      options: {
        options: [
          { label: 'Printer', value: 1 },
          { label: 'Printer group', value: 2 },
          { label: 'File (UserFile)', value: 3 },
          { label: 'Queue item', value: 4 },
        ],
      },
    }),
    subjectId: Property.ShortText({
      displayName: 'Subject ID',
      description: 'Numeric ID (or UID string for files) of the entity to detach the tag from.',
      required: true,
    }),
    tagId: Property.Number({
      displayName: 'Tag ID',
      description: 'Numeric custom tag ID to remove.',
      required: true,
    }),
  },
  async run(context) {
    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'tags/Detach',
      body: {
        type: context.propsValue.subjectType,
        id: context.propsValue.subjectId,
        tag_id: context.propsValue.tagId,
      },
    });
  },
});
