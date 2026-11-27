import { beamerAuth } from '../auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { beamerClient } from '../common/client';

export const createFeatureRequestAction = createAction({
  auth: beamerAuth,
  name: 'create_new_feature_request',
  classification: 'WRITE',
  displayName: 'Create New Feature Request ',
  description: 'Create New Feature Request',
  audience: 'both',
  aiMetadata: {
    description: 'Creates a feature request on a Beamer feedback board, attributed to a user by email, with a category (bug, feature request, or improvement), a status (under review, planned, in progress, or completed), and public or internal visibility. Use to log product feedback or roadmap items. Creates a new request on each call (not idempotent).',
    idempotent: false,
  },
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
    return await beamerClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/requests',
      body: {
        title: [context.propsValue.title],
        content: [context.propsValue.content],
        visible: context.propsValue.visible,
        category: context.propsValue.category,
        status: context.propsValue.status,
        userEmail: context.propsValue.requestedby,
      },
    });
  },
});
