import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { pcloudAuth } from '../auth';

export const pcloudCreateLink = createAction({
  auth: pcloudAuth,
  name: 'create_pcloud_link',
  displayName: 'Create Share Link',
  description: 'Create a public share link for a file',
  props: {
    fileId: Property.Number({
      displayName: 'File ID',
      description: 'The ID of the file to share',
      required: false,
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'The path to the file. Use fileId or path.',
      required: false,
    }),
    expireDate: Property.DateTime({
      displayName: 'Expire Date',
      description: 'Optional expiration date for the link',
      required: false,
    }),
    maxDownloads: Property.Number({
      displayName: 'Max Downloads',
      description: 'Maximum number of downloads allowed',
      required: false,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      description: 'Optional password to protect the link',
      required: false,
    }),
    shortLink: Property.Checkbox({
      displayName: 'Generate Short Link',
      description: 'Generate a short pc.cd link',
      defaultValue: false,
      required: false,
    }),
  },
  async run(context) {
    const params: Record<string, any> = {};
    
    if (context.propsValue.fileId) {
      params.fileid = context.propsValue.fileId;
    } else if (context.propsValue.path) {
      params.path = context.propsValue.path;
    } else {
      throw new Error('Either fileId or path must be provided');
    }

    if (context.propsValue.expireDate) {
      params.expire = new Date(context.propsValue.expireDate).toISOString();
    }

    if (context.propsValue.maxDownloads) {
      params.maxdownloads = context.propsValue.maxDownloads;
    }

    if (context.propsValue.password) {
      params.linkpassword = context.propsValue.password;
    }

    if (context.propsValue.shortLink) {
      params.shortlink = 1;
    }

    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.pcloud.com/getfilepublink',
      queryParams: params,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    if (result.body.result !== 0) {
      throw new Error(`Failed to create share link: ${JSON.stringify(result.body)}`);
    }

    return result.body;
  },
});
