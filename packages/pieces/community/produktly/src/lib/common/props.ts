import { DropdownState, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { produktlyApiCall } from './client';
import { produktlyAuth } from './auth';

export const produktlyProps = {
  changelog: Property.Dropdown({
    auth: produktlyAuth,
    displayName: 'Changelog',
    description: 'The changelog the post belongs to.',
    required: true,
    refreshers: [],
    options: async ({ auth }): Promise<DropdownState<string>> => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first',
        };
      }
      try {
        const response = await produktlyApiCall<{ data: Changelog[] }>({
          auth,
          method: HttpMethod.GET,
          path: '/changelogs',
        });
        return {
          disabled: false,
          options: response.body.data.map((changelog) => ({
            label: changelog.name + (changelog.active ? '' : ' (inactive)'),
            value: String(changelog.id),
          })),
        };
      } catch (e) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load changelogs. Check your connection.',
        };
      }
    },
  }),
  feedbackWidget: Property.Dropdown({
    auth: produktlyAuth,
    displayName: 'Feedback Widget',
    description: 'The feedback widget to read responses from.',
    required: true,
    refreshers: [],
    options: async ({ auth }): Promise<DropdownState<string>> => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first',
        };
      }
      try {
        const response = await produktlyApiCall<{ data: FeedbackWidget[] }>({
          auth,
          method: HttpMethod.GET,
          path: '/feedback-widgets',
        });
        return {
          disabled: false,
          options: response.body.data.map((widget) => ({
            label: widget.name + (widget.active ? '' : ' (inactive)'),
            value: String(widget.id),
          })),
        };
      } catch (e) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load feedback widgets. Check your connection.',
        };
      }
    },
  }),
  npsWidget: Property.Dropdown({
    auth: produktlyAuth,
    displayName: 'NPS Widget',
    description: 'The NPS widget to read responses from.',
    required: true,
    refreshers: [],
    options: async ({ auth }): Promise<DropdownState<string>> => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first',
        };
      }
      try {
        const response = await produktlyApiCall<{ data: NpsWidget[] }>({
          auth,
          method: HttpMethod.GET,
          path: '/nps-widgets',
        });
        return {
          disabled: false,
          options: response.body.data.map((widget) => ({
            label: widget.name + (widget.active ? '' : ' (inactive)'),
            value: String(widget.id),
          })),
        };
      } catch (e) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load NPS widgets. Check your connection.',
        };
      }
    },
  }),
  roadmap: Property.Dropdown({
    auth: produktlyAuth,
    displayName: 'Roadmap',
    description: 'The public roadmap to inspect.',
    required: true,
    refreshers: [],
    options: async ({ auth }): Promise<DropdownState<string>> => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first',
        };
      }
      try {
        const response = await produktlyApiCall<{ data: Roadmap[] }>({
          auth,
          method: HttpMethod.GET,
          path: '/roadmaps',
        });
        return {
          disabled: false,
          options: response.body.data.map((roadmap) => ({
            label: roadmap.publicName || roadmap.name,
            value: String(roadmap.id),
          })),
        };
      } catch (e) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load roadmaps. Check your connection.',
        };
      }
    },
  }),
  tag: Property.Dropdown({
    auth: produktlyAuth,
    displayName: 'Tag',
    description: 'A Produktly tag used to categorise changelog posts.',
    required: true,
    refreshers: [],
    options: async ({ auth }): Promise<DropdownState<string>> => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first',
        };
      }
      try {
        const response = await produktlyApiCall<{ data: Tag[] }>({
          auth,
          method: HttpMethod.GET,
          path: '/tags',
        });
        return {
          disabled: false,
          options: response.body.data.map((tag) => ({
            label: tag.name,
            value: tag.name,
          })),
        };
      } catch (e) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load tags. Check your connection.',
        };
      }
    },
  }),
};

type Changelog = {
  id: number;
  name: string;
  active: boolean;
  createdAt: string;
};

type FeedbackWidget = {
  id: number;
  name: string;
  active: boolean;
  createdAt: string;
};

type NpsWidget = {
  id: number;
  name: string;
  active: boolean;
  createdAt: string;
};

type Roadmap = {
  id: number;
  name: string;
  publicName: string;
  active: boolean;
  customDomain: string;
  publicId: string;
};

type Tag = {
  id: number;
  name: string;
  backgroundColor: string;
  textColor: string;
};
