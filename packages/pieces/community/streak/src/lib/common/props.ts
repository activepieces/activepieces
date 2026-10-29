import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { streakApiCall } from './client';
import {
  StreakBox,
  StreakPipeline,
  StreakStage,
  StreakTeamsResponse,
} from './types';
import { streakAuth } from './auth';

export const pipelineDropdown = Property.Dropdown({
  auth: streakAuth,
  displayName: 'Pipeline',
  description:
    'The pipeline to use. Pipelines are your workflows in Streak (e.g. Sales CRM, Hiring, Project Tracker).',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your Streak account first',
      };
    }
    try {
      const response = await streakApiCall<StreakPipeline[]>({
        apiKey: auth.secret_text,
        method: HttpMethod.GET,
        path: '/api/v1/pipelines',
      });
      return {
        disabled: false,
        options: (response.body ?? []).map((p) => ({
          label: p.name,
          value: p.pipelineKey ?? p.key,
        })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load pipelines. Check your API key.',
      };
    }
  },
});

export const stageDropdown = Property.Dropdown({
  auth: streakAuth,
  displayName: 'Stage',
  description:
    'The stage that the box should be in. Stages are the columns of a pipeline (e.g. Lead, Negotiating, Closed Won).',
  required: false,
  refreshers: ['pipelineKey'],
  options: async ({ auth, pipelineKey }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your Streak account first',
      };
    }
    if (!pipelineKey) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please select a pipeline first',
      };
    }
    try {
      const response = await streakApiCall<Record<string, StreakStage>>({
        apiKey: auth.secret_text,
        method: HttpMethod.GET,
        path: `/api/v1/pipelines/${pipelineKey}/stages`,
      });
      const stages = Object.values(response.body ?? {});
      return {
        disabled: false,
        options: stages.map((s) => ({ label: s.name, value: s.key })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load stages for this pipeline.',
      };
    }
  },
});

export const boxDropdown = Property.Dropdown({
  auth: streakAuth,
  displayName: 'Box',
  description: 'The box (record) inside the selected pipeline to operate on.',
  required: true,
  refreshers: ['pipelineKey'],
  options: async ({ auth, pipelineKey }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your Streak account first',
      };
    }
    if (!pipelineKey) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please select a pipeline first',
      };
    }
    try {
      const boxes = new Map<string, StreakBox>();
      for (let page = 0; page < BOX_DROPDOWN_MAX_PAGES; page++) {
        const response = await streakApiCall<StreakBox[]>({
          apiKey: auth.secret_text,
          method: HttpMethod.GET,
          path: `/api/v1/pipelines/${pipelineKey}/boxes`,
          queryParams: {
            sortBy: 'lastUpdatedTimestamp',
            limit: String(BOX_DROPDOWN_PAGE_SIZE),
            page: String(page),
          },
        });
        const pageBoxes = response.body ?? [];
        const sizeBefore = boxes.size;
        for (const box of pageBoxes) {
          boxes.set(box.boxKey ?? box.key, box);
        }
        if (
          pageBoxes.length < BOX_DROPDOWN_PAGE_SIZE ||
          boxes.size === sizeBefore
        ) {
          break;
        }
      }
      return {
        disabled: false,
        options: [...boxes.values()].map((b) => ({
          label: b.name,
          value: b.boxKey ?? b.key,
        })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load boxes for this pipeline.',
      };
    }
  },
});

export const teamDropdown = Property.Dropdown({
  auth: streakAuth,
  displayName: 'Team',
  description:
    'The Streak team that owns this contact or organization. Contacts and organizations are shared at the team level.',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your Streak account first',
      };
    }
    try {
      const response = await streakApiCall<StreakTeamsResponse>({
        apiKey: auth.secret_text,
        method: HttpMethod.GET,
        path: '/api/v2/users/me/teams',
      });
      return {
        disabled: false,
        options: (response.body?.results ?? []).map((t) => ({
          label: t.name,
          value: t.key,
        })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load teams. Check your API key.',
      };
    }
  },
});

const BOX_DROPDOWN_PAGE_SIZE = 200;
const BOX_DROPDOWN_MAX_PAGES = 10;
