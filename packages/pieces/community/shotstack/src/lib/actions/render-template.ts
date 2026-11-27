import { createAction, InputPropertyMap, Property, tryCatch } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { shotstackAuth } from '../auth';
import { shotstackApi } from '../common';

export const renderTemplate = createAction({
  auth: shotstackAuth,
  name: 'render_template',
  classification: 'WRITE',
  displayName: 'Render Template',
  description: 'Renders a template saved in your Shotstack account, filling in its placeholders.',
  audience: 'both',
  aiMetadata: {
    description:
      "Render a template saved in the Shotstack account, replacing its {{ PLACEHOLDER }} merge fields with the given values; any field left out keeps the template's own value. Use Render From JSON when you have a full edit instead. Each call starts and bills a new render, so retries duplicate.",
    idempotent: false,
  },
  props: {
    template_id: Property.Dropdown({
      auth: shotstackAuth,
      displayName: 'Template',
      description: 'Templates saved in your Shotstack account, newest first.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return { disabled: true, options: [], placeholder: 'Connect your Shotstack account first' };
        }
        const { data, error } = await tryCatch(() =>
          shotstackApi.request<{ templates?: Template[] }>({
            connection: auth.props,
            method: HttpMethod.GET,
            path: '/templates',
          }),
        );
        if (error) {
          return { disabled: true, options: [], placeholder: error.message };
        }
        const templates = data.templates ?? [];
        if (templates.length === 0) {
          return { disabled: true, options: [], placeholder: 'No templates yet. Save one in Shotstack Studio.' };
        }
        return {
          disabled: false,
          options: [...templates]
            .sort((a, b) => String(b.updated ?? b.created).localeCompare(String(a.updated ?? a.created)))
            .map((t) => ({ label: t.name, value: t.id })),
        };
      },
    }),
    merge_fields: Property.DynamicProperties({
      auth: shotstackAuth,
      displayName: 'Merge Fields',
      description: "The chosen template's placeholders, one box each. Leave a box empty to keep the template's own value.",
      required: false,
      refreshers: ['template_id'],
      props: async ({ auth, template_id }): Promise<InputPropertyMap> => {
        if (!auth || typeof template_id !== 'string' || template_id === '') {
          return {};
        }
        const fields = await shotstackApi.getTemplateMerge({ connection: auth.props, id: template_id });
        return Object.fromEntries(
          fields.map(({ find, replace }) => [
            find,
            Property.ShortText({
              displayName: find,
              required: false,
              placeholder: typeof replace === 'string' ? replace : JSON.stringify(replace),
            }),
          ]),
        );
      },
    }),
    merge: Property.Object({
      displayName: 'More Merge Fields',
      description:
        'Optional name and value pairs, for values an earlier step or an AI agent built. They override the boxes above. Write the placeholder name without braces: for `{{ TITLE }}` write `TITLE`.',
      required: false,
      advanced: true,
    }),
    wait: shotstackApi.renderWait,
  },
  async run({ auth, propsValue }) {
    const templateMerge = await shotstackApi.getTemplateMerge({ connection: auth.props, id: propsValue.template_id });
    const merge = shotstackApi.mergeList({
      templateMerge,
      sources: [propsValue.merge_fields ?? {}, propsValue.merge ?? {}],
    });
    return shotstackApi.startRender({
      connection: auth.props,
      path: '/templates/render',
      body: merge.length > 0 ? { id: propsValue.template_id, merge } : { id: propsValue.template_id },
      wait: propsValue.wait,
    });
  },
});

type Template = { id: string; name: string; created?: string; updated?: string };
