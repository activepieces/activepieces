import { ApFile, Property, ProcessorFn } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';

import FormData from 'form-data';

const processText: ProcessorFn<any, string> = (property, text) => {
  // LinkedIn Posts API has a list of characters that need to be escaped since it's type is "LittleText"
  // https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2023-11&tabs=http
  // https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/little-text-format?view=li-lms-2023-11
  // eslint-disable-next-line no-useless-escape
  return text.replace(/[\(*\)\[\]\{\}<>@|~_]/gm, (x: string) => '\\' + x);
};

export const linkedinCommon = {
  baseUrl: 'https://api.linkedin.com',
  linkedinHeaders: {
    'X-Restli-Protocol-Version': '2.0.0',
  },
  text: Property.LongText({
    displayName: 'Text',
    processors: [processText],
    required: true,
  }),
  imageUrl: Property.File({
    displayName: 'Image',
    required: false,
  }),
  link: Property.ShortText({
    displayName: 'Content - URL',
    required: false,
  }),
  linkTitle: Property.ShortText({
    displayName: 'Content - Title',
    required: false,
  }),
  linkDescription: Property.ShortText({
    displayName: 'Content - Description',
    required: false,
  }),
  visibility: Property.Dropdown({
    displayName: 'Visibility',
    refreshers: [],
    required: true,
    options: async () => {
      return {
        options: [
          {
            label: 'Public',
            value: 'PUBLIC',
          },
          {
            label: 'Connections Only',
            value: 'CONNECTIONS',
          },
        ],
      };
    },
  }),

  company: Property.Dropdown({
    displayName: 'Company Page',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your account',
          options: [],
        };
      }
      const authProp = auth as { access_token: string };

      const companies: any = await linkedinCommon.getCompanies(
        authProp.access_token
      );
      const options = [];
      for (const company in companies) {
        options.push({
          label: companies[company].localizedName,
          value: companies[company].id,
        });
      }

      return {
        options: options,
      };
    },
  }),

  getCompanies: async (accessToken: string) => {
    const companies = (
      await httpClient.sendRequest({
        url: `${linkedinCommon.baseUrl}/v2/organizationalEntityAcls`,
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: accessToken,
        },
        queryParams: {
          q: 'roleAssignee',
        },
      })
    ).body;

    const companyIds = companies.elements.map(
      (company: { organizationalTarget: string }) => {
        return company.organizationalTarget.substr(
          company.organizationalTarget.lastIndexOf(':') + 1
        );
      }
    );

    const companySearch = (
      await httpClient.sendRequest({
        url: `${
          linkedinCommon.baseUrl
        }/v2/organizations?ids=List(${companyIds.join(',')})`,
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: accessToken,
        },
        headers: linkedinCommon.linkedinHeaders,
      })
    ).body;

    return companySearch.results;
  },

  generatePostRequestBody: (data: {
    urn: string;
    text: any;
    link?: string | undefined;
    linkTitle?: string | undefined;
    linkDescription?: string | undefined;
    visibility: string;
    image?: Image | undefined;
  }) => {
    const requestObject: Post = {
      author: `urn:li:${data.urn}`,
      lifecycleState: 'PUBLISHED',
      commentary: data.text,
      distribution: {
        feedDistribution: 'MAIN_FEED',
      },
      visibility: data.visibility,
      isReshareDisabledByAuthor: false,
    };

    if (data.link) {
      requestObject.content = {
        article: {
          source: data.link,
          title: data.linkTitle,
          description: data.linkDescription,
          thumbnail: data.image?.value.image,
        },
      };
    } else if (data.image) {
      requestObject.content = {
        media: {
          id: data.image.value.image,
        },
      };
    }

    return requestObject;
  },

  uploadImage: async (
    accessToken: string,
    urn: string,
    image: ApFile
  ): Promise<Image> => {
    const uploadData = (
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${linkedinCommon.baseUrl}/v2/images`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: accessToken,
        },
        queryParams: {
          action: 'initializeUpload',
        },
        body: {
          initializeUploadRequest: {
            owner: `urn:li:${urn}`,
          },
        },
      })
    ).body as Image;

    const uploadFormData = new FormData();
    const { filename, base64 } = image;
    uploadFormData.append('file', Buffer.from(base64, 'base64'), filename);

    await httpClient.sendRequest({
      url: uploadData.value.uploadUrl,
      method: HttpMethod.POST,
      body: uploadFormData,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return uploadData;
  },
};
export interface UgcPost {
  author: string;
  lifecycleState: string;
  specificContent: {
    'com.linkedin.ugc.ShareContent': {
      shareCommentary: {
        text?: string;
      };
      shareMediaCategory: string;
      media?: [
        {
          status: string;
          description?: {
            text: string;
          };
          originalUrl?: string;
          thumbnail?: string;
          title?: {
            text: string;
          };
        }
      ];
    };
  };
  visibility: {
    'com.linkedin.ugc.MemberNetworkVisibility': string;
  };
}

export interface Post {
  author: string;
  commentary: string;
  lifecycleState: string;
  visibility: string;
  distribution: {
    feedDistribution: string;
  };
  content?: {
    article?: {
      source: string;
      thumbnail?: string | undefined;
      title?: string | undefined;
      description?: string | undefined;
    };
    media?: {
      id: string;
    };
  };
  isReshareDisabledByAuthor: boolean;
}

export interface Image {
  value: {
    uploadUrlExpiresAt: number;
    uploadUrl: string;
    image: string;
  };
}
