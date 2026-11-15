import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaTagOutputSchema } from '../../output-schemas';

export const asanaGetTagAction = createAction({
  auth: asanaAuth,
  name: 'get_tag',
  classification: 'READ',
  displayName: 'Get Tag',
  description: 'Get the details of an Asana tag.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one tag by gid with its name, color, description, followers, workspace and link. Use List Tag Tasks for the tasks carrying it. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaTagOutputSchema,
  props: {
    tag: Property.ShortText({
      displayName: 'Tag GID',
      description: 'Gid of the tag. Obtain it from List Tags, List Task Tags or Search Workspace Objects (object type tag).',
      required: true,
    }),
  },
  async run(context) {
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/tags/${asanaUtils.pathSegment(context.propsValue.tag)}`,
      operation: 'Get Tag',
      query: { opt_fields: ASANA_FIELDS.tag },
    });
  },
});
