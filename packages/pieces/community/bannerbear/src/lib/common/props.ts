import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bannerbearAuth } from '../auth';
import { bannerbearClient } from './client';

const TEMPLATE_SET_MAX_PAGES = 40;

export const bannerbearProps = {
  template: ({ required }: { required: boolean }) =>
    Property.Dropdown({
      auth: bannerbearAuth,
      displayName: 'Template',
      description: 'The Bannerbear template to use.',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your Bannerbear account first.',
          };
        }
        try {
          const templates = await bannerbearClient.listAllTemplates(
            auth.secret_text
          );
          return {
            disabled: false,
            options: templates.map((t) => ({
              label: t.name ?? t.uid,
              value: t.uid,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: `Could not load templates: ${
              error instanceof Error ? error.message : String(error)
            }`,
          };
        }
      },
    }),
  templateSet: Property.Dropdown({
    auth: bannerbearAuth,
    displayName: 'Template Set',
    description: 'The template set to render as a collection.',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your Bannerbear account first.',
        };
      }
      if (bannerbearClient.getVersion(auth.secret_text) === 'v5') {
        return {
          disabled: true,
          options: [],
          placeholder: 'Template sets are not available with V5 API keys.',
        };
      }
      try {
        const options: { label: string; value: string }[] = [];
        let truncated = true;
        for (let page = 1; page <= TEMPLATE_SET_MAX_PAGES; page++) {
          const batch = await bannerbearClient.request<
            { uid: string; name?: string }[]
          >({
            apiKey: auth.secret_text,
            method: HttpMethod.GET,
            path: '/template_sets',
            queryParams: { page: String(page) },
          });
          options.push(
            ...batch.map((s) => ({ label: s.name ?? s.uid, value: s.uid }))
          );
          if (batch.length < 25) {
            truncated = false;
            break;
          }
        }
        if (truncated) {
          return {
            disabled: false,
            options,
            placeholder: `Showing the first ${options.length} template sets only; use the Bannerbear dashboard to find others.`,
          };
        }
        return { disabled: false, options };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: `Could not load template sets: ${
            error instanceof Error ? error.message : String(error)
          }`,
        };
      }
    },
  }),
  waitForCompletion: Property.Checkbox({
    displayName: 'Wait for Completion',
    description: 'Wait up to 2 minutes for the render; else return pending.',
    required: false,
    defaultValue: true,
  }),
};
