import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../..';
import { makeClient, tarventCommon } from '../common';

export const getAudienceGroups = createAction({
  auth: tarventAuth,
  name: 'tarvent_get_audience_groups',
  displayName: 'Find Audience Group',
  description: 'Finds an audience group by name.',
  props: {
    audienceId: tarventCommon.audienceId(true, ''),
    name: Property.ShortText({
      displayName: 'Audience name',
      description: 'Find an audience by searching using its name.',
      required: false,
      defaultValue: '',

    })
  },
  async run(context) {
    const { audienceId, name } = context.propsValue;

    const client = makeClient(context.auth);
    return await client.listAudienceGroupsAdv(audienceId, name);
  },
});
