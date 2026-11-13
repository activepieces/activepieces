import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeMappers } from '../../common/mappers';
import { closeOutputSchemas } from '../../common/output-schemas';

const ACTIVITY_TYPES = ['note', 'call', 'email', 'sms', 'meeting'];

const getActivity = createAction({
  auth: closeAuth,
  name: 'get_activity',
  classification: 'READ',
  displayName: 'Get Activity',
  description: 'Get one note, call, email, SMS or meeting by ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Gets one Close activity by activityId (acti_...) and its type: note, call, email, sms or meeting (the type field from List Activities, lowercased). Throws if the ID does not exist for that type. Returns the activity.',
    idempotent: true,
  },
  outputSchema: closeOutputSchemas.activity,
  props: {
    activityType: Property.StaticDropdown({
      displayName: 'Activity Type',
      required: true,
      options: { options: [{ label: 'Note', value: 'note' }, { label: 'Call', value: 'call' }, { label: 'Email', value: 'email' }, { label: 'SMS', value: 'sms' }, { label: 'Meeting', value: 'meeting' }] },
    }),
    activityId: Property.ShortText({ displayName: 'Activity ID', required: true }),
  },
  async run({ auth, propsValue }) {
    const activityType = closeClient.requiredText({ value: propsValue.activityType, label: 'Activity Type' }).toLowerCase();
    if (!ACTIVITY_TYPES.includes(activityType)) throw new Error(`Activity Type must be one of: ${ACTIVITY_TYPES.join(', ')}.`);
    const activityId = closeClient.closeId({ value: propsValue.activityId, label: 'Activity ID', prefix: 'acti' });
    const result = await closeClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/activity/${activityType}/${closeClient.pathId(activityId)}/`,
    });
    return closeMappers.activity(result);
  },
});

export { getActivity };
