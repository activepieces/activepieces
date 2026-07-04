import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { makeClient, tarventCommon } from '../common';

export const getAudienceGroups = createAction({
  auth: tarventAuth,
  name: 'tarvent_get_audience_groups',
  displayName: 'Find Audience Group',
  description: 'Finds an audience group by name.',
  audience: 'both',
  aiMetadata: { description: 'Searches the groups within a given Tarvent audience, optionally filtered by name; leaving the name empty returns all groups in that audience. Use to look up a group or its ID before assigning contacts. Idempotent read-only lookup.', idempotent: true },
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
