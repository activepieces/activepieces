import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { asanaClient, asanaUtils } from '../../common/client';
import { asanaDeleteTagOutputSchema } from '../../output-schemas';

export const asanaDeleteTagAction = createAction({
  auth: asanaAuth,
  name: 'delete_tag',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Tag',
  description: 'Delete an Asana tag.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a tag and removes it from every task that carries it (the tasks themselves stay). To take the tag off one task only, use Remove Tag from Task. Irreversible; repeating the call on the same tag fails.',
    idempotent: false,
  },
  outputSchema: asanaDeleteTagOutputSchema,
  props: {
    tag: Property.ShortText({
      displayName: 'Tag GID',
      description: 'Gid of the tag to delete. Obtain it from List Tags.',
      required: true,
    }),
  },
  async run(context) {
    const tag = context.propsValue.tag.trim();
    await asanaClient.asanaEmpty({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/tags/${asanaUtils.pathSegment(tag)}`,
      operation: 'Delete Tag',
    });
    return { success: true, tag_gid: tag };
  },
});
