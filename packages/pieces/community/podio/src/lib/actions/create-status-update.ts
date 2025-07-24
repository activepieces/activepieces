import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../../index';
import { podioApiCall } from '../common/client';
import { PodioStatusUpdate } from '../common/types';

export const createStatusUpdateAction = createAction({
  name: 'create_status_update',
  displayName: 'Create Status Update',
  description: 'Creates a status update in Podio.',
  auth: podioAuth,
  props: {
    value: Property.LongText({
      displayName: 'Status Text',
      description: 'The content of the status update',
      required: true,
    }),
    refType: Property.StaticDropdown({
      displayName: 'Reference Type',
      description: 'Type of object this status relates to (optional)',
      required: false,
      options: {
        options: [
          { label: 'Item', value: 'item' },
          { label: 'Task', value: 'task' },
          { label: 'App', value: 'app' },
          { label: 'Space', value: 'space' },
          { label: 'Organization', value: 'org' },
        ],
      },
    }),
    refId: Property.Number({
      displayName: 'Reference ID',
      description: 'ID of the referenced object (optional)',
      required: false,
    }),
    isAlert: Property.Checkbox({
      displayName: 'Send Alert',
      description: 'Whether to send an alert notification',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { value, refType, refId, isAlert } = context.propsValue;

    if (!value) {
      throw new Error('Status text is required.');
    }

    const body: any = {
      value,
    };

    if (refType && refId) {
      body.ref_type = refType;
      body.ref_id = refId;
    }

    if (isAlert !== undefined) {
      body.alert_invite = isAlert;
    }

    // https://developers.podio.com/doc/status/add-new-status-message-22336
    const response = await podioApiCall<PodioStatusUpdate>({
      auth: context.auth,
      method: HttpMethod.POST,
      resourceUri: '/status/',
      body,
    });

    return response;
  },
});