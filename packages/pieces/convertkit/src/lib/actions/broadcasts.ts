import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../..';
import {
  API_ENDPOINT,
  broadcastId,
  page,
  content,
  description,
  emailAddress,
  emailLayoutTemplate,
  isPublic,
  publishedAt,
  sendAt,
  subject,
  thumbnailAlt,
  thumbnailUrl,
} from '../common/broadcasts';
import { CONVERTKIT_API_URL } from '../common/constants';

export const listBroadcasts = createAction({
  auth: convertkitAuth,
  name: 'broadcasts_list_broadcasts',
  displayName: 'Broadcast: List Broadcasts',
  description: 'List all broadcasts',
  props: {
    page,
  },
  async run(context) {
    const page = context.propsValue.page || 1;
    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}?page=${page}&api_secret=${context.auth}`;

    const response = await fetch(url);

    if (!response.ok) {
      return { success: false, message: 'Error fetching broadcasts' };
    }

    const data = await response.json();

    // return broadcasts if exists
    if (data.broadcasts) {
      return data.broadcasts;
    }

    return data;
  },
});

export const createBroadcast = createAction({
  auth: convertkitAuth,
  name: 'broadcasts_create_broadcast',
  displayName: 'Broadcast: Create Broadcast',
  description: 'Create a new broadcast',
  props: {
    content,
    description,
    emailAddress,
    emailLayoutTemplate,
    isPublic,
    publishedAt,
    sendAt,
    subject,
    thumbnailAlt,
    thumbnailUrl,
  },
  async run(context) {
    const {
      content,
      description,
      emailAddress,
      emailLayoutTemplate,
      isPublic,
      publishedAt,
      sendAt,
      subject,
      thumbnailAlt,
      thumbnailUrl,
    } = context.propsValue;
    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}?api_secret=${context.auth}`;

    const body = JSON.stringify({
      content,
      description,
      email_address: emailAddress,
      email_layout_template: emailLayoutTemplate,
      public: isPublic,
      published_at: publishedAt,
      send_at: sendAt,
      subject,
      thumbnail_alt: thumbnailAlt,
      thumbnail_url: thumbnailUrl,
    });

    const response = await fetch(url, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { success: false, message: 'Error creating broadcast' };
    }

    const data = await response.json();

    // if broadcast exists, return it
    if (data.broadcast) {
      return data.broadcast;
    }

    return data;
  },
});

export const getBroadcastById = createAction({
  auth: convertkitAuth,
  name: 'broadcasts_get_broadcast',
  displayName: 'Broadcast: Get Broadcast',
  description: 'Get a broadcast',
  props: {
    broadcastId,
  },
  async run(context) {
    const { broadcastId } = context.propsValue;
    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}/${broadcastId}?api_secret=${context.auth}`;

    const response = await fetch(url);

    if (!response.ok) {
      return { success: false, message: 'Error fetching broadcast' };
    }

    const data = await response.json();

    // if broadcast exists, return it
    if (data.broadcast) {
      return data.broadcast;
    }

    return data;
  },
});

export const updateBroadcast = createAction({
  auth: convertkitAuth,
  name: 'broadcasts_update_broadcast',
  displayName: 'Broadcast: Update Broadcast',
  description: 'Update a broadcast',
  props: {
    broadcastId,
    content,
    description,
    emailAddress,
    emailLayoutTemplate,
    isPublic,
    publishedAt,
    sendAt,
    subject,
    thumbnailAlt,
    thumbnailUrl,
  },

  async run(context) {
    const {
      broadcastId,
      content,
      description,
      emailAddress,
      emailLayoutTemplate,
      isPublic,
      publishedAt,
      sendAt,
      subject,
      thumbnailAlt,
      thumbnailUrl,
    } = context.propsValue;

    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}/${broadcastId}?api_secret=${context.auth}`;

    const body = JSON.stringify({
      content,
      description,
      email_address: emailAddress,
      email_layout_template: emailLayoutTemplate,
      public: isPublic,
      published_at: publishedAt,
      send_at: sendAt,
      subject,
      thumbnail_alt: thumbnailAlt,
      thumbnail_url: thumbnailUrl,
    });

    const response = await fetch(url, {
      method: 'PUT',
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { success: false, message: 'Error updating broadcast' };
    }

    const data = await response.json();

    // if broadcast exists, return it
    if (data.broadcast) {
      return data.broadcast;
    }

    return data;
  },
});

export const broadcastStats = createAction({
  auth: convertkitAuth,
  name: 'broadcasts_broadcast_stats',
  displayName: 'Broadcast: Broadcast Stats',
  description: 'Get broadcast stats',
  props: {
    broadcastId,
  },
  async run(context) {
    const { broadcastId } = context.propsValue;
    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}/${broadcastId}/stats?api_secret=${context.auth}`;

    const response = await fetch(url);

    if (!response.ok) {
      return { success: false, message: 'Error fetching broadcast stats' };
    }

    const data = await response.json();

    // if broadcast exists, return it
    if (data.broadcast) {
      return data.broadcast;
    }

    return data;
  },
});

export const deleteBroadcast = createAction({
  auth: convertkitAuth,
  name: 'broadcasts_delete_broadcast',
  displayName: 'Broadcast: Delete Broadcast',
  description: 'Delete a broadcast',
  props: {
    broadcastId,
  },
  async run(context) {
    const { broadcastId } = context.propsValue;
    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}/${broadcastId}?api_secret=${context.auth}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { success: false, message: 'Error deleting broadcast' };
    }
    return { success: true, message: 'Broadcast deleted successfully' };
  },
});
