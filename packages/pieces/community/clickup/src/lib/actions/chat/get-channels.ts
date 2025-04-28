import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  getAccessTokenOrThrow,
  propsValidation,
} from '@activepieces/pieces-common';
import { callClickUpApi3, clickupCommon } from '../../common';
import { clickupAuth } from '../../../';
import { z } from 'zod';

export const getClickupChannels = createAction({
  auth: clickupAuth,
  name: 'get_channels',
  description: 'Gets all channels in a ClickUp workspace',
  displayName: 'Get Channels',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    include_hidden: Property.Checkbox({
      description: 'Include hidden channels',
      displayName: 'Include Hidden',
      required: false,
      defaultValue: false,
    }),
    limit: Property.Number({
      description: 'Limit the number of channels returned',
      displayName: 'Limit',
      required: false,
      defaultValue: 50,
    }),
  },

  async run(configValue) {
    await propsValidation.validateZod(configValue.propsValue, {
      limit: z
        .number()
        .min(0)
        .max(100, 'You can fetch between 1 and 100 messages'),
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
