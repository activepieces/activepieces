import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../..';
import { makeClient } from '../common';

export const getAudiences = createAction({
  auth: tarventAuth,
  name: 'tarvent_get_audiences',
  displayName: 'Find Audience',
  description: 'Finds an audience by name or tags.',
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
