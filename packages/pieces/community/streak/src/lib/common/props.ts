import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';

import { streakAuth } from '../auth';
import { extractCollection, streakRequest } from './client';

export const pipelineKeyProp = Property.Dropdown({
  displayName: 'Pipeline',
  required: true,
  refreshers: [],
  auth: streakAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Streak account first.',
        options: [],
      };
    }

    const response = await streakRequest({
      apiKey: auth.props.api_key,
      method: HttpMethod.GET,
      path: '/v1/pipelines',
    });

    const pipelines = extractCollection<{ key?: string; name?: string }>(
      response.body,
    );

    return {
      disabled: false,
      options: pipelines
        .filter((pipeline) => pipeline.key)
        .map((pipeline) => ({
          label: pipeline.name ?? pipeline.key!,
          value: pipeline.key!,
        })),
    };
  },
});

export const stageKeyProp = Property.Dropdown({
  displayName: 'Stage',
  required: false,
  refreshers: ['pipelineKey'],
  auth: streakAuth,
  options: async ({ auth, pipelineKey }) => {
    if (!auth || !pipelineKey) {
      return {
        disabled: true,
        placeholder: 'Select a pipeline first.',
        options: [],
      };
    }

    const response = await streakRequest({
      apiKey: auth.props.api_key,
      method: HttpMethod.GET,
      path: `/v1/pipelines/${encodeURIComponent(String(pipelineKey))}/stages`,
    });

    const stages = extractCollection<{ key?: string; name?: string }>(
      response.body,
    );

    return {
      disabled: false,
      options: stages
        .filter((stage) => stage.key)
        .map((stage) => ({
          label: stage.name ?? stage.key!,
          value: stage.key!,
        })),
    };
  },
});

export const boxKeyProp = Property.Dropdown({
  displayName: 'Box',
  required: true,
  refreshers: ['pipelineKey'],
  auth: streakAuth,
  options: async ({ auth, pipelineKey }) => {
    if (!auth || !pipelineKey) {
      return {
        disabled: true,
        placeholder: 'Select a pipeline first.',
        options: [],
      };
    }

    const response = await streakRequest({
      apiKey: auth.props.api_key,
      method: HttpMethod.GET,
      path: `/v1/pipelines/${encodeURIComponent(String(pipelineKey))}/boxes`,
      queryParams: {
        limit: '500',
      },
    });

    const boxes = extractCollection<{ key?: string; name?: string }>(
      response.body,
    );

    return {
      disabled: false,
      options: boxes
        .filter((box) => box.key)
        .map((box) => ({
          label: box.name ?? box.key!,
          value: box.key!,
        })),
    };
  },
});
