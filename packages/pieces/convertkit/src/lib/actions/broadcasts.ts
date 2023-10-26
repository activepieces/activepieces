import { createAction, Property } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../..';
import { CONVERTKIT_API_URL } from '../common';

const API_ENDPOINT = 'broadcasts/';

// const now = new Date();

const broadcastProps = {
  content: Property.ShortText({
    displayName: 'Content',
    description:
      "The broadcast's email content - this can contain text and simple HTML markdown (such as h1, img or p tags)",
    required: false,
  }),
  description: Property.ShortText({
    displayName: 'Description',
    description: 'An internal description of this broadcast',
    required: false,
  }),
  email_address: Property.ShortText({
    displayName: 'Email Address',
    description:
      "Sending email address; leave blank to use your account's default sending email address",
    required: false,
  }),
  email_layout_template: Property.ShortText({
    displayName: 'Email Layout Template',
    description:
      "Name of the email template to use; leave blank to use your account's default email template",
    required: false,
  }),
  public: Property.Checkbox({
    displayName: 'Public',
    description: 'Specifies whether or not this is a public post',
    required: false,
    defaultValue: false,
  }),
  published_at: Property.DateTime({
    displayName: 'Published At',
    description:
      'Specifies the time that this post was published (applicable only to public posts)',
    required: false,
    // defaultValue: now.toDateString(),
  }),
  send_at: Property.DateTime({
    displayName: 'Send At',
    description:
      'Time that this broadcast should be sent; leave blank to create a draft broadcast. If set to a future time, this is the time that the broadcast will be scheduled to send.',
    required: false,
    // defaultValue: now.toDateString(),
  }),
  subject: Property.ShortText({
    displayName: 'Subject',
    description: "The broadcast email's subject",
    required: false,
  }),
  thumbnail_alt: Property.ShortText({
    displayName: 'Thumbnail Alt',
    description:
      'Specify the ALT attribute of the public thumbnail image (applicable only to public posts)',
    required: false,
  }),
  thumbnail_url: Property.ShortText({
    displayName: 'Thumbnail Url',
    description:
      'Specify the URL of the thumbnail image to accompany the broadcast post (applicable only to public posts)',
    required: false,
  }),
};

export const listBroadcasts = createAction({
  auth: convertkitAuth,
  name: 'list_broadcasts',
  displayName: 'Broadcast: List Broadcasts',
  description: 'List all broadcasts',
  props: {
    page: Property.Number({
      displayName: 'Page',
      description:
        'Page number. Each page of results will contain up to 50 broadcasts.',
      required: false,
    }),
  },
  async run(context) {
    const page = context.propsValue.page || 1;
    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}?page=${page}?api_secret=${context.auth}`;

    // Fetch URL using fetch api
    const response = await fetch(url);

    // Get response body
    const data = await response.json();

    // Return response body
    return data;
  },
});

export const createBroadcast = createAction({
  auth: convertkitAuth,
  name: 'create_broadcast',
  displayName: 'Broadcast: Create Broadcast',
  description: 'Create a new broadcast',
  props: broadcastProps,
  async run(context) {
    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}?api_secret=${context.auth}`;

    // Fetch URL using fetch api
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ ...context.propsValue }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Get response body
    const data = await response.json();

    // Return response body
    return data;
  },
});

export const getBroadcastById = createAction({
  auth: convertkitAuth,
  name: 'get_broadcast',
  displayName: 'Broadcast: Get Broadcast',
  description: 'Get a broadcast',
  props: {
    broadcastId: Property.ShortText({
      displayName: 'Broadcast Id',
      description: 'The broadcast id',
      required: true,
    }),
  },
  async run(context) {
    const { broadcastId } = context.propsValue;
    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}${broadcastId}?api_secret=${context.auth}`;

    // Fetch URL using fetch api
    const response = await fetch(url);

    // Get response body
    const data = await response.json();

    // Return response body
    return data;
  },
});

export const updateBroadcast = createAction({
  auth: convertkitAuth,
  name: 'update_broadcast',
  displayName: 'Broadcast: Update Broadcast',
  description: 'Update a broadcast',
  props: {
    broadcastId: Property.ShortText({
      displayName: 'Broadcast Id',
      description: 'The broadcast id',
      required: true,
    }),
    ...broadcastProps,
  },
  async run(context) {
    const { broadcastId } = context.propsValue;
    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}${broadcastId}?api_secret=${context.auth}`;

    // TODO: How to remove the 'auth' key?
    // put all values, except broadcastId, in props
    const { broadcastId: _, ...props } = context.propsValue;

    // Fetch URL using fetch api
    const response = await fetch(url, {
      method: 'PUT',
      body: JSON.stringify({ ...props }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Get response body
    const data = await response.json();

    // Return response body
    return data;
  },
});

export const deleteBroadcast = createAction({
  auth: convertkitAuth,
  name: 'delete_broadcast',
  displayName: 'Broadcast: Delete Broadcast',
  description: 'Delete a broadcast',
  props: {
    broadcastId: Property.ShortText({
      displayName: 'Broadcast Id',
      description: 'The broadcast id',
      required: true,
    }),
  },
  async run(context) {
    const { broadcastId } = context.propsValue;
    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}${broadcastId}?api_secret=${context.auth}`;

    // Fetch URL using fetch api
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Get response body
    const data = await response.json();

    // Return response body
    return data;
  },
});

