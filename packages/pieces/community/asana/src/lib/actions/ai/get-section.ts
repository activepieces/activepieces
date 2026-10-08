import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaSectionOutputSchema } from '../../output-schemas';

export const asanaGetSectionAction = createAction({
  auth: asanaAuth,
  name: 'get_section',
  classification: 'READ',
  displayName: 'Get Section',
  description: 'Get the details of an Asana section.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one section by gid with its name, creation time and project. Use List Section Tasks for its tasks. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaSectionOutputSchema,
  props: {
    section: Property.ShortText({
      displayName: 'Section GID',
      description: 'Gid of the section. Obtain it from List Sections.',
      required: true,
    }),
  },
  async run(context) {
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/sections/${asanaUtils.pathSegment(context.propsValue.section)}`,
      operation: 'Get Section',
      query: { opt_fields: ASANA_FIELDS.section },
    });
  },
});
