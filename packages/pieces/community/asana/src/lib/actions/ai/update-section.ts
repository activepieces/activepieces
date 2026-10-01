import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaSectionOutputSchema } from '../../output-schemas';

export const asanaUpdateSectionAction = createAction({
  auth: asanaAuth,
  name: 'update_section',
  classification: 'WRITE',
  displayName: 'Rename Section',
  description: 'Rename an Asana section.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Renames a section; the name is the only section field Asana lets you change. Use Move Section to reorder it. Setting the same name again converges, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaSectionOutputSchema,
  props: {
    section: Property.ShortText({
      displayName: 'Section GID',
      description: 'Gid of the section. Obtain it from List Sections.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Section Name',
      description: 'New name of the section. Cannot be empty.',
      required: true,
    }),
  },
  async run(context) {
    const { section, name } = context.propsValue;
    if (name.trim() === '') {
      throw new Error('Section Name cannot be empty.');
    }
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/sections/${asanaUtils.pathSegment(section)}`,
      operation: 'Update Section',
      query: { opt_fields: ASANA_FIELDS.section },
      data: { name },
    });
  },
});
