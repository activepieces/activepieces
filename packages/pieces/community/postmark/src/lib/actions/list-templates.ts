import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { postmarkAuth } from '../auth';
import { postmarkApiRequest } from '../common';

export const listTemplates = createAction({
  auth: postmarkAuth,
  name: 'list_templates',
  displayName: 'List Templates',
  description: 'List all email templates in your Postmark server',
  props: {
    count: Property.Number({
      displayName: 'Count',
      description: 'Number of templates to return (default: 100)',
      required: false,
      defaultValue: 100,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of templates to skip',
      required: false,
      defaultValue: 0,
    }),
    templateType: Property.StaticDropdown({
      displayName: 'Template Type',
      description: 'Filter by template type',
      required: false,
      defaultValue: 'All',
      options: {
        disabled: false,
        options: [
          { label: 'All', value: 'All' },
          { label: 'Standard', value: 'Standard' },
          { label: 'Layout', value: 'Layout' },
        ],
      },
    }),
  },
  async run(context) {
    const queryParams: Record<string, string> = {
      count: String(context.propsValue.count ?? 100),
      offset: String(context.propsValue.offset ?? 0),
    };

    if (
      context.propsValue.templateType &&
      context.propsValue.templateType !== 'All'
    ) {
      queryParams['TemplateType'] = context.propsValue.templateType;
    }

    return await postmarkApiRequest({
      apiKey: context.auth,
      method: HttpMethod.GET,
      endpoint: '/templates',
      queryParams,
    });
  },
});
