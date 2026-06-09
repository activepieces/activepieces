import { createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { Image, linkedinCommon, santizeText } from '../common';
import { linkedinAuth } from '../..';

export const createCompanyUpdate = createAction({
  auth: linkedinAuth,
  name: 'create_company_update',
  displayName: 'Create Company Update',
  description: 'Create a new company update for Company Page',
  audience: 'both',
  aiMetadata: {
    description:
      'Publishes a new post to a LinkedIn organization (company) page, with optional image and link preview; posts are always public. Use this to share content on behalf of a company rather than a personal profile, and requires the target organization id plus admin access to that page. Not idempotent: each call creates a separate post, so repeating it with the same text produces a duplicate.',
    idempotent: false,
  },
  props: {
    company: linkedinCommon.company,
    imageUrl: linkedinCommon.imageUrl,
    text: linkedinCommon.text,
    link: linkedinCommon.link,
    linkTitle: linkedinCommon.linkTitle,
    linkDescription: linkedinCommon.linkDescription,
  },

  run: async (context) => {
    const imageUrl = context.propsValue.imageUrl;
    const bodyConfig: {
      urn: string;
      text: string;
      link?: string | undefined;
      linkDescription?: string | undefined;
      linkTitle?: string | undefined;
      visibility: string;
      image?: Image | undefined;
    } = {
      urn: `organization:${context.propsValue.company}`,
      text: santizeText(context.propsValue.text),
      link: context.propsValue.link,
      linkDescription: context.propsValue.linkDescription,
      linkTitle: context.propsValue.linkTitle,
      visibility: 'PUBLIC',
    };

    if (imageUrl) {
      bodyConfig.image = await linkedinCommon.uploadImage(
        context.auth.access_token,
        `organization:${context.propsValue.company}`,
        imageUrl
      );
    }

    const requestBody = linkedinCommon.generatePostRequestBody(bodyConfig);
    const createPostHeaders: any = linkedinCommon.linkedinHeaders;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${linkedinCommon.baseUrl}/rest/posts`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
      headers: createPostHeaders,
      body: requestBody,
    };

    const response = await httpClient.sendRequest(request);
    return {
      success: true,
    };
  },
});
