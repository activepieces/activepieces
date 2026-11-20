import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { syncmateAuth } from '../auth';
import { syncmateRequest } from '../common/client';
import { channelOptions, groupOptions } from '../common/props';

export const listGroupsAction = createAction({
  auth: syncmateAuth,
  name: 'listGroups',
  displayName: 'List Groups',
  description: 'List the WhatsApp groups of your QR-connected number, with their IDs.',
  props: {},
  async run({ auth }) {
    const response = await syncmateRequest({ auth, method: HttpMethod.GET, path: '/groups' });
    return { groups: groupOptions(response).map((g) => ({ id: g.value, name: g.label })) };
  },
});

export const listChannelsAction = createAction({
  auth: syncmateAuth,
  name: 'listChannels',
  displayName: 'List Channels',
  description: 'List the WhatsApp channels (newsletters) of your QR-connected number, with their IDs.',
  props: {},
  async run({ auth }) {
    const response = await syncmateRequest({ auth, method: HttpMethod.GET, path: '/channels' });
    return { channels: channelOptions(response).map((c) => ({ id: c.value, name: c.label })) };
  },
});

export const checkConnectionAction = createAction({
  auth: syncmateAuth,
  name: 'checkConnection',
  displayName: 'Check Number Connection',
  description: 'Check whether the QR-connected WhatsApp number of this connection is online, e.g. before a large send.',
  props: {},
  async run({ auth }) {
    try {
      return await syncmateRequest({ auth, method: HttpMethod.GET, path: '/v1/whatsapp/connection' });
    } catch (e) {
      // The client answers "not connected" as a 404 with isConnected: 0; report it as data, not a failure.
      const message = e instanceof Error ? e.message : String(e);
      if (message.startsWith('Not found')) {
        return { isConnected: 0, connected: false, message };
      }
      throw e;
    }
  },
});

export const getSendStatusAction = createAction({
  auth: syncmateAuth,
  name: 'getSendStatus',
  displayName: 'Get Send Status',
  description:
    'Look up a queued send by the Job ID a send action returned: queued, retrying, delivered or failed, and SyncMate\'s answer.',
  props: {
    jobId: Property.ShortText({
      displayName: 'Job ID',
      description: 'The job_id from a Send action\'s output.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const jobId = String(propsValue.jobId ?? '').trim();
    if (!/^[A-Za-z0-9-]+$/.test(jobId)) {
      throw new Error('Enter the job_id returned by a SyncMate send action.');
    }
    const response = await syncmateRequest<{ job?: Record<string, unknown> }>({
      auth,
      method: HttpMethod.GET,
      path: `/gateway/jobs/${jobId}`,
    });
    const job = response?.job ?? {};
    let upstream: unknown = job['upstream_body'];
    if (typeof upstream === 'string') {
      try {
        upstream = JSON.parse(upstream);
      } catch {
        // keep the raw text
      }
    }
    return { ...job, upstream_body: upstream };
  },
});
