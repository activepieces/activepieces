import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendrAuth } from '../auth';
import { pageTemplateDropdown, sendrApiCall } from '../common';

export const getPageTemplateVariables = createAction({
  auth: sendrAuth,
  name: 'get_page_template_variables',
  displayName: 'Get Page Template Variables',
  description: 'Returns the custom variables (placeholders) defined in a selected page template — for example first_name, company, or email.',
  props: {
    template: pageTemplateDropdown,
  },
  async run(context) {
    const response = await sendrApiCall<{
      variables: { id: string; name?: string; type?: string; defaultValue?: string; [key: string]: unknown }[];
    }>({
      token: context.auth as unknown as string,
      method: HttpMethod.GET,
      path: `/page-template/${context.propsValue.template}/variables`,
    });
    const variables = response.body?.variables ?? [];
    return variables.map((v) => ({
      id: v.id,
      name: v.name ?? null,
      type: v.type ?? null,
      default_value: v.defaultValue ?? null,
    }));
  },
});
