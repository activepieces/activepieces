import { Property } from '@activepieces/pieces-framework';

export const channelIdentifier = Property.ShortText({
  displayName: 'Channel',
  description: "Paste the channel's URL, its @handle, or its ID.",
  placeholder: '@GoogleDevelopers',
  required: true,
});
