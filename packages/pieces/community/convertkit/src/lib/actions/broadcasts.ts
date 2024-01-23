import { createAction } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { convertkitAuth } from '../..';
import {
  broadcastId,
  broadcastPageNumber,
  broadcastContent,
  description,
  broadcastEmailAddress,
  emailLayoutTemplate,
  isPublic,
  publishedAt,
  sendAt,
  subject,
  thumbnailAlt,
  thumbnailUrl,
} from '../common/broadcasts';
import { Broadcast } from '../common/types';
import { BROADCASTS_API_ENDPOINT } from '../common/constants';
import { fetchBroadcasts } from '../common/service';

export const listBroadcasts = createAction({
  auth: convertkitAuth,
  name: 'broadcasts_list_broadcasts',
  displayName: 'List Broadcasts',
  description: 'List all broadcasts',
  props: {
    page: broadcastPageNumber,
  },
  run(context) {
    const page = context.propsValue.page || 1;
    return fetchBroadcasts(context.auth, page);
  },
});

export const createBroadcast = createAction({
  auth: convertkitAuth,
  name: 'broadcasts_create_broadcast',
  displayName: 'Create Broadcast',
  description: 'Create a new broadcast',
  props: {
    content: broadcastContent,
    description,
    emailAddress: broadcastEmailAddress,
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
    const url = BROADCASTS_API_ENDPOINT;

    const body = {
      api_secret: context.auth,
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
    };

    const request: HttpRequest = {
      url,
      method: HttpMethod.POST,
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const response = await httpClient.sendRequest<{ broadcast: Broadcast }>(
      request
    );
    if (response.status !== 201) {
      throw new Error(`Error creating broadcast: ${response.status}`);
    }
    return response.body.broadcast;
  },
});

export const getBroadcastById = createAction({
  auth: convertkitAuth,
  name: 'broadcasts_get_broadcast',
  displayName: 'Get Broadcast',
  description: 'Get a broadcast',
  props: {
    broadcastId: broadcastId,
  },
  async run(context) {
    const { broadcastId } = context.propsValue;
    const url = `${BROADCASTS_API_ENDPOINT}/${broadcastId}`;

    const body = {
      api_secret: context.auth,
    };

    const request: HttpRequest = {
      url,
      body,
      method: HttpMethod.GET,
    };
    const response = await httpClient.sendRequest<{ broadcast: Broadcast }>(
      request
    );
    if (response.status !== 200) {
      throw new Error(`Error fetching broadcast: ${response.status}`);
    }
    return response.body.broadcast;
  },
});

export const updateBroadcast = createAction({
  auth: convertkitAuth,
  name: 'broadcasts_update_broadcast',
  displayName: 'Update Broadcast',
  description: 'Update a broadcast',
  props: {
    broadcastId: broadcastId,
    content: broadcastContent,
    description,
    emailAddress: broadcastEmailAddress,
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

    const url = `${BROADCASTS_API_ENDPOINT}/${broadcastId}`;

    const body = {
      api_secret: context.auth,
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
    };

    const request: HttpRequest = {
      url,
      method: HttpMethod.PUT,
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const response = await httpClient.sendRequest<{ broadcast: Broadcast }>(
      request
    );
    if (response.status !== 200) {
      throw new Error(`Error updating broadcast: ${response.status}`);
    }
    return response.body.broadcast;
  },
});

export const broadcastStats = createAction({
  auth: convertkitAuth,
  name: 'broadcasts_broadcast_stats',
  displayName: 'Broadcast Stats',
  description: 'Get broadcast stats',
  props: {
    broadcastId: broadcastId,
  },
  async run(context) {
    const { broadcastId } = context.propsValue;
    const url = `${BROADCASTS_API_ENDPOINT}/${broadcastId}/stats`;

    const body = {
      api_secret: context.auth,
    };

    const request: HttpRequest = {
      url,
      body,
      method: HttpMethod.GET,
    };
    const response = await httpClient.sendRequest<{ broadcast: Broadcast }>(
      request
    );
    if (response.status !== 200) {
      throw new Error(`Error fetching broadcast stats: ${response.status}`);
    }
    return response.body.broadcast;
  },
});

export const deleteBroadcast = createAction({
  auth: convertkitAuth,
  name: 'broadcasts_delete_broadcast',
  displayName: 'Delete Broadcast',
  description: 'Delete a broadcast',
  props: {
    broadcastId: broadcastId,
  },
  async run(context) {
    const { broadcastId } = context.propsValue;
    const url = `${BROADCASTS_API_ENDPOINT}/${broadcastId}`;

    const body = {
      api_secret: context.auth,
    };

    const request: HttpRequest = {
      url,
      body,
      method: HttpMethod.DELETE,
    };
    const response = await httpClient.sendRequest<{ broadcast: Broadcast }>(
      request
    );
    if (response.status !== 204) {
      throw new Error(`Error deleting broadcast: ${response.status}`);
    }
    return {
      message: `Broadcast ${broadcastId} deleted successfully`,
      status: response.status,
      success: true,
    };
  },
});
