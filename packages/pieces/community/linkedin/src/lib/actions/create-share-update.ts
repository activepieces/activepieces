import { createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { Image, linkedinCommon } from '../common';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { linkedinAuth } from '../..';

export const createShareUpdate = createAction({
  auth: linkedinAuth,
  name: 'create_share_update',
  displayName: 'Create Share Update',
  description: 'Create a share update on LinkedIn',
  props: {
    text: linkedinCommon.text,
    visibility: linkedinCommon.visibility,
    imageUrl: linkedinCommon.imageUrl,
    link: linkedinCommon.link,
    linkTitle: linkedinCommon.linkTitle,
    linkDescription: linkedinCommon.linkDescription,
  },

  run: async (context) => {
    const token = context.auth.data.id_token;
    const decoded: JwtPayload = jwt.decode(token) as JwtPayload;
    const imageUrl = context.propsValue.imageUrl;
    const { text, link, linkDescription, linkTitle, visibility } =
      context.propsValue;
    let image: Image | undefined;
    if (imageUrl) {
      image = await linkedinCommon.uploadImage(
        context.auth.access_token,
        `person:${decoded.sub}`,
        imageUrl
      );
    }

    const requestBody = linkedinCommon.generatePostRequestBody({
      urn: `person:${decoded.sub}`,
      text,
      link,
      linkDescription,
      linkTitle,
      visibility,
      image,
    });
    const createPostHeaders: any = linkedinCommon.linkedinHeaders;
    createPostHeaders['LinkedIn-Version'] = '202312';

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
