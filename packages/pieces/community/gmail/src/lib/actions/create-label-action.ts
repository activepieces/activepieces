import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../index';
import { GmailRequests } from '../common/data';

const GMAIL_COLORS = [
  { label: 'Black', textColor: '#000000', backgroundColor: '#000000' },
  { label: 'Dark Gray', textColor: '#434343', backgroundColor: '#434343' },
  { label: 'Gray', textColor: '#666666', backgroundColor: '#666666' },
  { label: 'Light Gray', textColor: '#999999', backgroundColor: '#999999' },
  { label: 'Pale Gray', textColor: '#cccccc', backgroundColor: '#cccccc' },
  {
    label: 'Very Light Gray',
    textColor: '#efefef',
    backgroundColor: '#efefef',
  },
  { label: 'Almost White', textColor: '#f3f3f3', backgroundColor: '#f3f3f3' },
  { label: 'White', textColor: '#ffffff', backgroundColor: '#ffffff' },
  { label: 'Red', textColor: '#fb4c2f', backgroundColor: '#fb4c2f' },
  { label: 'Orange', textColor: '#ffad47', backgroundColor: '#ffad47' },
  { label: 'Yellow', textColor: '#fad165', backgroundColor: '#fad165' },
  { label: 'Green', textColor: '#16a766', backgroundColor: '#16a766' },
  { label: 'Light Green', textColor: '#43d692', backgroundColor: '#43d692' },
  { label: 'Blue', textColor: '#4a86e8', backgroundColor: '#4a86e8' },
  { label: 'Purple', textColor: '#a479e2', backgroundColor: '#a479e2' },
  { label: 'Pink', textColor: '#f691b3', backgroundColor: '#f691b3' },
  { label: 'Light Pink', textColor: '#f6c5be', backgroundColor: '#f6c5be' },
  { label: 'Light Orange', textColor: '#ffe6c7', backgroundColor: '#ffe6c7' },
  { label: 'Light Yellow', textColor: '#fef1d1', backgroundColor: '#fef1d1' },
  { label: 'Light Mint', textColor: '#b9e4d0', backgroundColor: '#b9e4d0' },
  {
    label: 'Very Light Green',
    textColor: '#c6f3de',
    backgroundColor: '#c6f3de',
  },
  { label: 'Light Blue', textColor: '#c9daf8', backgroundColor: '#c9daf8' },
  { label: 'Light Purple', textColor: '#e4d7f5', backgroundColor: '#e4d7f5' },
  {
    label: 'Very Light Pink',
    textColor: '#fcdee8',
    backgroundColor: '#fcdee8',
  },
];

export const gmailCreateLabelAction = createAction({
  auth: gmailAuth,
  name: 'create_label',
  displayName: 'Create Label',
  description: 'Creates a new label.',
  props: {
    name: Property.ShortText({
      displayName: 'Label Name',
      description:
        'The name of the label to create (max 50 characters, no < > " characters)',
      required: true,
    }),
    messageListVisibility: Property.StaticDropdown({
      displayName: 'Message List Visibility',
      description:
        'The visibility of messages with this label in the message list',
      required: false,
      defaultValue: 'show',
      options: {
        disabled: false,
        options: [
          { label: 'Show', value: 'show' },
          { label: 'Hide', value: 'hide' },
        ],
      },
    }),
    labelListVisibility: Property.StaticDropdown({
      displayName: 'Label List Visibility',
      description: 'The visibility of the label in the label list',
      required: false,
      defaultValue: 'labelShow',
      options: {
        disabled: false,
        options: [
          { label: 'Show', value: 'labelShow' },
          { label: 'Show if unread', value: 'labelShowIfUnread' },
          { label: 'Hide', value: 'labelHide' },
        ],
      },
    }),
    useCustomColor: Property.Checkbox({
      displayName: 'Use Custom Color',
      description: 'Enable to set a custom color for the label',
      required: false,
      defaultValue: false,
    }),
    textColor: Property.StaticDropdown({
      displayName: 'Text Color',
      description: 'The text color of the label',
      required: false,
      options: {
        disabled: false,
        options: GMAIL_COLORS.map((color) => ({
          label: `${color.label} (${color.textColor})`,
          value: color.textColor,
        })),
      },
    }),
    backgroundColor: Property.StaticDropdown({
      displayName: 'Background Color',
      description: 'The background color of the label',
      required: false,
      options: {
        disabled: false,
        options: GMAIL_COLORS.map((color) => ({
          label: `${color.label} (${color.backgroundColor})`,
          value: color.backgroundColor,
        })),
      },
    }),
  },
  async run(context) {
    const {
      name,
      messageListVisibility,
      labelListVisibility,
      useCustomColor,
      textColor,
      backgroundColor,
    } = context.propsValue;
    const { access_token } = context.auth;

    try {
      if (!name || name.trim().length === 0) {
        throw new Error('Label name is required');
      }
      if (name.length > 50) {
        throw new Error('Label name must be 50 characters or less');
      }
      if (/[<>"]/.test(name)) {
        throw new Error('Label name cannot contain < > " characters');
      }

      if (useCustomColor && (!textColor || !backgroundColor)) {
        throw new Error(
          'Both text color and background color are required when using custom colors'
        );
      }

      const existingLabelsResponse = await GmailRequests.getLabels(
        context.auth
      );
      const existingLabels = existingLabelsResponse.body.labels || [];
      const duplicateLabel = existingLabels.find(
        (label) =>
          label.name.toLowerCase() === name.toLowerCase() &&
          label.type === 'user'
      );

      if (duplicateLabel) {
        throw new Error(`A label with the name "${name}" already exists`);
      }

      const labelData: {
        access_token: string;
        name: string;
        messageListVisibility: 'show' | 'hide';
        labelListVisibility: 'labelShow' | 'labelShowIfUnread' | 'labelHide';
        color?: {
          textColor: string;
          backgroundColor: string;
        };
      } = {
        access_token,
        name: name.trim(),
        messageListVisibility: messageListVisibility as 'show' | 'hide',
        labelListVisibility: labelListVisibility as
          | 'labelShow'
          | 'labelShowIfUnread'
          | 'labelHide',
      };

      if (useCustomColor && textColor && backgroundColor) {
        labelData.color = {
          textColor,
          backgroundColor,
        };
      }

      const response = await GmailRequests.createLabel(labelData);

      return response;
    } catch (error: any) {
      if (error.response?.status === 400) {
        const errorMessage =
          error.response.data?.error?.message || 'Invalid request';
        if (errorMessage.includes('already exists')) {
          throw new Error(`Label "${name}" already exists`);
        }
        if (errorMessage.includes('Invalid label name')) {
          throw new Error(
            'Invalid label name. Please check the name format and try again'
          );
        }
        if (errorMessage.includes('color')) {
          throw new Error(
            'Invalid color values. Please select valid Gmail colors'
          );
        }
        throw new Error(`Gmail API Error: ${errorMessage}`);
      }

      if (error.response?.status === 403) {
        throw new Error(
          'Insufficient permissions to create labels. Please check your Gmail API permissions'
        );
      }

      if (error.response?.status === 429) {
        throw new Error(
          'Gmail API rate limit exceeded. Please try again later'
        );
      }

      if (error.response?.status === 500) {
        throw new Error('Gmail API server error. Please try again later');
      }

      throw error;
    }
  },
});
