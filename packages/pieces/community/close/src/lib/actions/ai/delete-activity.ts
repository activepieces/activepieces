import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeOutputSchemas } from '../../common/output-schemas';

const ACTIVITY_TYPES = ['note', 'call', 'email', 'sms', 'meeting'];

const deleteActivity = createAction({
  auth: closeAuth,
  name: 'delete_activity',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Activity',
  description: 'Permanently delete a note, call, email, SMS or meeting.',
  audience: 'ai',
  aiMetadata: {
    description: 'Permanently deletes one Close activity by activityId (acti_...) and its type: note, call, email, sms or meeting. It cannot be undone and does not unsend an email or SMS that already went out. Repeating it on a deleted activity returns not found. Returns deleted true and the ID.',
    idempotent: false,
  },
  outputSchema: closeOutputSchemas.deleted,
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
    await closeClient.request({
      auth,
      method: HttpMethod.DELETE,
      path: `/activity/${activityType}/${closeClient.pathId(activityId)}/`,
    });
    return { deleted: true, id: activityId };
  },
});

export { deleteActivity };
