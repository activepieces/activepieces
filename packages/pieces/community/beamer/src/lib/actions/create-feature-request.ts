import { beamerAuth } from '../../index';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { beamerCommon } from '../common';

export const createNewFeatureRequest = createAction({
  auth: beamerAuth,
  name: 'create_new_feature_request',
  displayName: 'Create New Feature Request ',
  description: 'Create New Feature Request',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Enter the Title of the post',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Description',
      description: 'Enter the description of the post',
      required: true,
    }),
    visible: Property.StaticDropdown({
      displayName: 'Visibility',
      description: 'Set visiblisty',
      required: true,
      options: {
        options: [
          {
            label: 'Public',

            value: true,
          },
          {
            label: 'Internal',
            value: false,
          },
        ],
      },
    }),
    category: Property.StaticDropdown({
      displayName: 'Category',
      description: 'Set Category',
      required: true,
      options: {
        options: [
          {
            label: 'Bug',

            value: 'bug',
          },
          {
            label: 'Feature Request',
            value: 'feature_request',
          },
          {
            label: 'Improvement',
            value: 'improvement',
          },
        ],
      },
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Set status',
      required: true,
      options: {
        options: [
          {
            label: 'Under Review',
            value: 'under_review',
          },
          {
            label: 'Planned',
            value: 'planned',
          },
          {
            label: 'In Progress',
            value: 'in_progress',
          },
          {
            label: 'Completed',
            value: 'completed',
          },
        ],
      },
    }),

    requestedby: Property.ShortText({
      displayName: 'User Email',
      description: 'Feature requested by..',
      required: true,
    }),
  },

  async run(context) {
    const apiKey = context.auth;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${beamerCommon.baseUrl}/requests`,
      headers: {
        'Beamer-Api-Key': `${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        title: [context.propsValue.title],
        content: [context.propsValue.content],
        visible: context.propsValue.visible,
        category: context.propsValue.category,
        status: context.propsValue.status,
        userEmail: context.propsValue.requestedby,
      },
    };
    const res = await httpClient.sendRequest<any>(request);

    return res.body;
  },
});
