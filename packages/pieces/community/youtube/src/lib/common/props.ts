import { Property } from '@activepieces/pieces-framework';

export const channelIdentifier = Property.ShortText({
  displayName: 'Channel ID, URL, or handle',
  description: "YouTube channel's ID, URL, or handle (e.g: @DutchPilotGirl)",
  required: true,
});
