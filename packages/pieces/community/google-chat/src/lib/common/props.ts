import { Property } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const spaceIdDropdown = Property.Dropdown({
  displayName: 'Space',
  description: 'Select the space to use for the action',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please authenticate first',
      };
    }

    try {
      const authClient = new OAuth2Client();
      authClient.setCredentials(auth);
      const chat = google.chat({ version: 'v1', auth: authClient });
      
      const response = await chat.spaces.list({
        pageSize: 100, // Get up to 100 spaces
        filter: 'spaceType = "SPACE"', // Only get Chat spaces, not DMs
      });

      const options = response.data.spaces?.map((space) => ({
        label: space.displayName || space.name || 'Unnamed Space',
        value: space.name || '',
      })) || [];

      return {
        disabled: false,
        options: options,
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading spaces',
      };
    }
  },
});

