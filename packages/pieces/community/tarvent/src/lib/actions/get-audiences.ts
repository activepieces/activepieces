import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { makeClient } from '../common';

export const getAudiences = createAction({
  auth: tarventAuth,
  name: 'tarvent_get_audiences',
  displayName: 'Find Audience',
  description: 'Finds an audience by name or tags.',
  audience: 'both',
  aiMetadata: { description: 'Searches Tarvent audiences, optionally filtered by name and/or comma-separated tags; leaving the filters empty returns all audiences. Use to look up an audience or its ID before acting on contacts. Idempotent read-only lookup.', idempotent: true },
  props: {
    name: Property.ShortText({
      displayName: 'Audience name',
      description: 'Find an audience by searching using its name.',
      required: false,
      defaultValue: '',

    }),
    tags: Property.LongText({
      displayName: 'Audience tags',
      description: 'Find an audience by searching using its tags. To search using multiple tags, separate the tags with a comma.',
      required: false,
      defaultValue: '',
    })
  },
  async run(context) {
    const { name, tags } = context.propsValue;

    const client = makeClient(context.auth);
    return await client.listAudiencesAdv(name, tags);
  },
});
