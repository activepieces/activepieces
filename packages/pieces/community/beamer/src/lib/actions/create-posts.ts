import { Property, createAction } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { beamerAuth } from '../../index';
import { beamerCommon } from '../common';

export const createBeamerPost = createAction({
  auth: beamerAuth,
  name: 'create_beamer_post',
  displayName: 'Create Beamer Post ',
  description: 'Create a new post in Beamer',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Enter the Title of the post',
      required: true,
      defaultValue: 'Post name',
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Enter the description of the post',
      required: true,
      defaultValue: 'desc...',
    }),
    category: Property.StaticDropdown({
      displayName: 'Category',
      description: 'Set Category',
      required: true,
      options: {
        options: [
          {
            label: 'New',
            value: 'new',
          },
          {
            label: 'Fix',
            value: 'fix',
          },
          {
            label: 'Coming Soon ',
            value: 'coming_soon',
          },
          {
            label: 'Announcement',
            value: 'announcement',
          },
          {
            label: 'Improvement',
            value: 'improvement',
          },
        ],
      },
    }),
    showInWidget: Property.StaticDropdown({
      displayName: 'Show In Widget ',
      description: 'Check to enable widget',
      required: false,
      options: {
        options: [
          {
            label: 'True',
            value: true,
          },
          {
            label: 'False',
            value: false,
          },
        ],
      },
    }),
    showInStandalone: Property.StaticDropdown({
      displayName: 'Show In Standalone  ',
      description: 'Check to enable Standalone',
      required: false,
      options: {
        options: [
          {
            label: 'True',
            value: true,
          },
          {
            label: 'False',
            value: false,
          },
        ],
      },
    }),
    enableFeedback: Property.Checkbox({
      displayName: 'Enable Feedback',
      description: 'Check to enable feedback',
      required: false,
      defaultValue: false,
    }),
    enableReactions: Property.Checkbox({
      displayName: 'Enable Reactions',
      description: 'Check to enable feedback',
      required: false,
      defaultValue: false,
    }),
    enableSocialShare: Property.Checkbox({
      displayName: 'Enable Social share',
      description: 'Check to enable social share',
      required: false,
      defaultValue: false,
    }),
    autoOpen: Property.Checkbox({
      displayName: 'Enable Auto open',
      description: 'Check to enable auto open',
      required: false,
      defaultValue: false,
    }),
    sendPushNotification: Property.Checkbox({
      displayName: 'Enable Push Notifications',
      description: 'Check to enable Push Notifications',
      required: false,
      defaultValue: false,
    }),
    userEmail: Property.ShortText({
      displayName: 'User Email',
      description: 'Enter user email',
      required: true,
    }),
  },

  async run(context) {
    const apiKey = context.auth;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${beamerCommon.baseUrl}/posts`,
      headers: {
        'Beamer-Api-Key': `${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        title: [context.propsValue.title],
        content: [context.propsValue.description],
        category: context.propsValue.category,
        publish: true,
        archive: false,
        pinned: false,
        showInWidget: context.propsValue.showInWidget,
        showInStandalone: context.propsValue.showInStandalone,
        enableFeedback: context.propsValue.enableFeedback,
        enableReactions: context.propsValue.enableReactions,
        enableSocialShare: context.propsValue.enableSocialShare,
        autoOpen: context.propsValue.autoOpen,
        sendPushNotification: context.propsValue.sendPushNotification,
        userEmail: context.propsValue.userEmail,
        fixedBoostedAnnouncement: true,
      },
    };
    const res = await httpClient.sendRequest<any>(request);

    return res.body;
  },
});
