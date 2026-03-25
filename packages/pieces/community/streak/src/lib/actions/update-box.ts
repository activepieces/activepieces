import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { streakAuth } from '../auth';
import { boxKeyProp, pipelineKeyProp, stageKeyProp } from '../common/props';
import { cleanPayload, streakRequest } from '../common/client';

export const updateBoxAction = createAction({
  name: 'update_box',
  displayName: 'Update Box',
  description: 'Update properties on an existing Streak box.',
  auth: streakAuth,
  props: {
    pipelineKey: pipelineKeyProp,
    boxKey: boxKeyProp,
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
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
  },
  async run({ auth, propsValue }) {
    const payload = cleanPayload({
      name: propsValue.name,
      stageKey: propsValue.stageKey,
      notes: propsValue.notes,
      fields: propsValue.fields,
    });

    const response = await streakRequest({
      apiKey: auth.props.api_key,
      method: HttpMethod.POST,
      path: `/v1/boxes/${encodeURIComponent(propsValue.boxKey)}`,
      body: payload,
    });

    return response.body;
  },
});
