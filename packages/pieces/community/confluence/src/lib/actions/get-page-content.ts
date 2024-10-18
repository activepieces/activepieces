import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { confluenceAuth } from '../..';

export const getPageContent = createAction({
  name: 'getPageContent',
  displayName: 'Get Page Content',
  description: 'Confluence Cloud REST API v2',
  auth: confluenceAuth,
  props: {
    pageId: Property.ShortText({
      displayName: 'Page ID',
      description: 'Get this from the page URL of your Confluence Cloud',
      required: true
    }),
  },
  async run(context) {
    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.GET,
      url: `${context.auth.confluenceDomain}/wiki/api/v2/pages/${context.propsValue.pageId}`,
      queryParams: {
        "body-format": "storage"
      },
      authentication: {
        type: AuthenticationType.BASIC,
        username: context.auth.username,
        password: context.auth.password
      }
    });
    return res.body;
  },
});
