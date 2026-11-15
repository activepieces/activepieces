import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  getAccessTokenOrThrow,
  propsValidation,
} from '@activepieces/pieces-common';
import { callClickUpApi3, clickupCommon } from '../../common';
import { clickupAuth } from '../../auth';
import * as z from 'zod/mini'
import { getChannelsOutputSchema } from '../../output-schemas';

export const getClickupChannels = createAction({
  auth: clickupAuth,
  name: 'get_channels',
  classification: 'SEARCH',
  description: 'List the chat channels in a workspace.',
  audience: 'both',
  aiMetadata: { description: 'Read-only: list the Chat channels in a ClickUp workspace, optionally including hidden ones and capping the count (1-100). Use to discover channel IDs before reading or posting messages. Safe to call repeatedly.', idempotent: true },
  displayName: 'Get Channels',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    include_hidden: Property.Checkbox({
      description: 'Also list channels you have hidden.',
      displayName: 'Include Hidden Channels',
      required: false,
      defaultValue: false,
    }),
    limit: Property.Number({
      description: 'How many channels to return, up to 100.',
      displayName: 'Max Results',
      required: false,
      defaultValue: 50,
      display: 'stepper',
      min: 1,
      max: 100,
      step: 1,
    }),
  },

  outputSchema: getChannelsOutputSchema,
  async run(configValue) {
    await propsValidation.validateZod(configValue.propsValue, {
      limit: z.number().check(
        z.minimum(1, 'You can fetch between 1 and 100 channels'),
        z.maximum(100, 'You can fetch between 1 and 100 channels')
      ),
    });

    const { workspace_id, include_hidden, limit } = configValue.propsValue;

    const response = await callClickUpApi3(
      HttpMethod.GET,
      `workspaces/${workspace_id}/chat/channels`,
      getAccessTokenOrThrow(configValue.auth),
      undefined,
      {
        limit,
        is_follower: false,
        include_hidden,
      }
    );

    return response.body;
  },
});
