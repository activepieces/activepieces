import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { streakAuth } from '../auth';
import { cleanPayload, streakRequest } from '../common/client';
import { pipelineKeyProp, stageKeyProp } from '../common/props';

export const createBoxAction = createAction({
  name: 'create_box',
  displayName: 'Create Box',
  description: 'Create a new Streak box in a pipeline.',
  auth: streakAuth,
  props: {
    pipelineKey: pipelineKeyProp,
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    stageKey: stageKeyProp,
    notes: Property.LongText({
      displayName: 'Notes',
      required: false,
    }),
    fields: Property.Json({
      displayName: 'Field Values',
      description: 'Optional field values keyed by Streak field key.',
      required: false,
    }),
    contacts: Property.Json({
      displayName: 'Contacts',
      description: 'Optional contact payload to associate with the box.',
      required: false,
    }),
    assignedToSharingEntries: Property.Json({
      displayName: 'Assigned To Sharing Entries',
      description: 'Optional array of sharing entries to assign.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const payload = cleanPayload({
      name: propsValue.name,
      stageKey: propsValue.stageKey,
      notes: propsValue.notes,
      fields: propsValue.fields,
      contacts: propsValue.contacts,
      assignedToSharingEntries: propsValue.assignedToSharingEntries,
    });

    const response = await streakRequest({
      apiKey: auth.props.api_key,
      method: HttpMethod.POST,
      path: `/v2/pipelines/${encodeURIComponent(propsValue.pipelineKey)}/boxes`,
      body: payload,
    });

    return response.body;
  },
});
