import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../../index';
import { podioApiCall } from '../common/client';
import { PodioComment } from '../common/types';

export const createCommentAction = createAction({
  name: 'create_comment',
  displayName: 'Create Comment',
  description: 'Creates a comment on an item, task, or other object in Podio.',
  auth: podioAuth,
  props: {
    refType: Property.StaticDropdown({
      displayName: 'Reference Type',
      description: 'Type of object to comment on',
      required: true,
      options: {
        options: [
          { label: 'Item', value: 'item' },
          { label: 'Task', value: 'task' },
          { label: 'Status', value: 'status' },
          { label: 'App', value: 'app' },
          { label: 'Space', value: 'space' },
        ],
      },
    }),
    refId: Property.Number({
      displayName: 'Reference ID',
      description: 'ID of the object to comment on',
      required: true,
    }),
    value: Property.LongText({
      displayName: 'Comment Text',
      description: 'The content of the comment',
      required: true,
    }),
    isAlert: Property.Checkbox({
      displayName: 'Send Alert',
      description: 'Whether to send an alert notification',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { refType, refId, value, isAlert } = context.propsValue;

    if (!refType || !refId || !value) {
      throw new Error('Reference type, reference ID, and comment text are required.');
    }

    const body: any = {
      value,
      ref_type: refType,
      ref_id: refId,
    };

    if (isAlert !== undefined) {
      body.alert_invite = isAlert;
    }

    // https://developers.podio.com/doc/comments/add-comment-to-object-22340
    const response = await podioApiCall<PodioComment>({
      auth: context.auth,
      method: HttpMethod.POST,
      resourceUri: '/comment/',
      body,
    });

    return response;
  },
});