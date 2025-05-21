import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../..';
import { makeClient } from '../common';

export const getJourney = createAction({
  auth: tarventAuth,
  name: 'tarvent_get_journey',
  displayName: 'Find Journey',
  description: 'Finds a journey by name, status or tags.',
  props: {
    name: Property.ShortText({
      displayName: 'Journey name',
      description: 'Find a journey by searching using its name.',
      required: false,
      defaultValue: '',

    }),
    tags: Property.LongText({
      displayName: 'Journey tags',
      description: 'Find a journey by searching using its tags. To search using multiple tags, separate the tags with a comma.',
      required: false,
      defaultValue: '',
    }),
    status: Property.StaticDropdown({
      displayName: 'Journey status',
      description: '',
      required: false,
      options: {
        options: [
          {
            label: 'Running',
            value: 'RUNNING'
          },
          {
            label: 'Not running',
            value: 'NOT_RUNNING'
          }
        ],
      },
    }),
  },
  async run(context) {
    const { name, tags, status } = context.propsValue;

    const client = makeClient(context.auth);
    return await client.listJourneysAdv(name, tags, status);
  },
});
