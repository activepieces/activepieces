import {
  ApFile,
  MarkdownVariant,
  Property,
  chunk,
  tryCatch,
  unique,
} from '@activepieces/pieces-framework';
import {
  HttpMethod,
  httpClient,
  AuthenticationType,
  HttpError,
  HttpHeaders,
} from '@activepieces/pieces-common';

import FormData from 'form-data';
import jwt from 'jsonwebtoken';
import { linkedinAuth } from '../..';

export const santizeText = (text: string) => {
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
    'LinkedIn-Version': '202511',
  },
  text: Property.LongText({
    displayName: 'Text',
    description:
      'Up to 3,000 characters of plain text; an @ does not tag anyone.',
    required: true,
  }),
  imageUrl: Property.File({
    displayName: 'Image',
    required: false,
  }),
  postImage: Property.File({
    displayName: 'Image',
    description: "With a Link URL, the image becomes the link's thumbnail.",
    placeholder: 'https://example.com/photo.jpg',
    required: false,
  }),
  link: Property.ShortText({
    displayName: 'Link URL',
    placeholder: 'https://example.com/article',
    required: false,
  }),
  linkTitle: Property.ShortText({
    displayName: 'Link Title',
    placeholder: 'Article headline',
    required: false,
    width: 'half',
  }),
  linkDescription: Property.ShortText({
    displayName: 'Link Description',
    placeholder: 'One-line summary',
    required: false,
    width: 'half',
  }),
  linkPreviewInfo: Property.MarkDown({
    value: 'Title and description show only when a Link URL is set.',
    variant: MarkdownVariant.INFO,
  }),
  companyVisibilityInfo: Property.MarkDown({
    value: 'Posts to a Company Page are always public.',
    variant: MarkdownVariant.INFO,
  }),
  visibility: Property.Dropdown({
    auth: linkedinAuth,
    displayName: 'Visibility',
    description: 'Who can see the post.',
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
    auth: linkedinAuth,
    displayName: 'Company Page',
    description: 'Pages your LinkedIn account manages.',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your LinkedIn account first',
        };
      }
      const { data: companies, error } = await tryCatch(
        (): Promise<LinkedinCompany[]> =>
          linkedinCommon.getCompanies(auth.access_token)
      );
      if (error !== null) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Could not load your Company Pages',
        };
      }
      if (companies.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No Company Pages found',
        };
      }
      return {
        disabled: false,
        options: companies.map((company) => ({
          label: company.localizedName,
          value: company.id,
        })),
      };
    },
  }),

  getCompanies: async (accessToken: string): Promise<LinkedinCompany[]> => {
    const pageSize = 100;
    const maxPages = 10;
    const organizationTargets: string[] = [];
    for (let page = 0; page < maxPages; page++) {
      const response =
        await httpClient.sendRequest<OrganizationalEntityAclsResponse>({
          url: `${linkedinCommon.baseUrl}/v2/organizationalEntityAcls`,
          method: HttpMethod.GET,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: accessToken,
          },
          queryParams: {
            q: 'roleAssignee',
            state: 'APPROVED',
            start: String(page * pageSize),
            count: String(pageSize),
          },
        });
      const elements = response.body.elements ?? [];
      organizationTargets.push(
        ...elements.map((element) => element.organizationalTarget)
      );
      if (elements.length < pageSize) {
        break;
      }
    }

    const organizationIds = unique(
      organizationTargets.map((target) => organizationIdOf(target))
    );
    if (organizationIds.length === 0) {
      return [];
    }

    const lookups = await Promise.all(
      chunk(organizationIds, 50).map((ids) =>
        linkedinRawGet<OrganizationsLookupResponse>({
          accessToken,
          url: `${linkedinCommon.baseUrl}/rest/organizations?ids=List(${ids.join(
            ','
          )})`,
          resource: 'your Company Pages',
        })
      )
    );

    return lookups.flatMap((lookup) =>
      Object.values(lookup.results ?? {}).map((organization) => ({
        id: organization.id,
        localizedName: organization.localizedName,
      }))
    );
  },

  generatePostRequestBody: (data: {
    urn: string;
    text: string;
    link?: string | undefined;
    linkTitle?: string | undefined;
    linkDescription?: string | undefined;
    visibility: string;
    image?: Image | undefined;
    imageUrn?: string | undefined;
  }) => {
    const mediaId = data.image?.value.image ?? data.imageUrn;
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
          thumbnail: mediaId,
        },
      };
    } else if (mediaId) {
      requestObject.content = {
        media: {
          id: mediaId,
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

const readErrorStatus = (error: unknown): number | null => {
  if (typeof error !== 'object' || error === null) {
    return null;
  }
  const response = Reflect.get(error, 'response');
  if (typeof response !== 'object' || response === null) {
    return null;
  }
  const status = Reflect.get(response, 'status');
  return typeof status === 'number' ? status : null;
};

export const getLinkedinErrorStatus = (error: unknown): number | null =>
  readErrorStatus(error);

export const buildLinkedinError = ({
  error,
  resource,
}: {
  error: unknown;
  resource: string;
}): Error => {
  const status = readErrorStatus(error);
  if (status === 401) {
    return new Error(
      `LinkedIn rejected the connection while accessing ${resource}. Reconnect the LinkedIn account and try again.`
    );
  }
  if (status === 403) {
    return new Error(
      `LinkedIn denied access to ${resource}. The connected account needs an approved admin role on the target LinkedIn page, and the connection must grant the matching permission.`
    );
  }
  if (status === 404) {
    return new Error(`LinkedIn could not find ${resource}.`);
  }
  if (status === 429) {
    return new Error(
      `LinkedIn rate limit reached while accessing ${resource}. Wait before retrying.`
    );
  }
  return error instanceof Error ? error : new Error(String(error));
};

export const encodeUrn = (urn: string): string => encodeURIComponent(urn);

export const organizationIdOf = (urn: string): string =>
  urn.substring(urn.lastIndexOf(':') + 1);

export const getMemberSub = (idToken: string): string => {
  const decoded = jwt.decode(idToken);
  if (decoded === null || typeof decoded === 'string') {
    return '';
  }
  const sub = decoded.sub;
  if (typeof sub !== 'string' || sub.length === 0) {
    return '';
  }
  return sub;
};

export const getMemberUrn = (idToken: string): string => {
  const sub = getMemberSub(idToken);
  if (sub.length === 0) {
    throw new Error(
      'Could not resolve the authenticated LinkedIn member from the connection. Reconnect the LinkedIn account so that an OpenID token is issued.'
    );
  }
  return `urn:li:person:${sub}`;
};

export const linkedinJsonHeaders = (): HttpHeaders => ({
  ...linkedinCommon.linkedinHeaders,
});

export const linkedinRawGet = async <T>({
  accessToken,
  url,
  resource,
}: {
  accessToken: string;
  url: string;
  resource: string;
}): Promise<T> => {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...linkedinCommon.linkedinHeaders,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new HttpError(undefined, {
      status: response.status,
      responseBody: text,
    });
  }
  if (text.length === 0) {
    return JSON.parse('{}');
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `LinkedIn returned a ${response.status} response for ${resource} that is not valid JSON. The body started with: ${text.slice(
        0,
        MAX_ERROR_BODY_CHARS
      )}`
    );
  }
};

export const readRestliId = (headers: HttpHeaders | undefined): string | null => {
  if (headers === undefined) {
    return null;
  }
  const entry = Object.entries(headers).find(
    ([key]) => key.toLowerCase() === 'x-restli-id'
  );
  const value = entry === undefined ? undefined : entry[1];
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0];
  }
  return null;
};

export const createLinkedinPost = async ({
  accessToken,
  body,
}: {
  accessToken: string;
  body: Post;
}): Promise<PostCreationResult> => {
  const response = await httpClient.sendRequest({
    method: HttpMethod.POST,
    url: `${linkedinCommon.baseUrl}/rest/posts`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
    headers: linkedinJsonHeaders(),
    body,
  });
  return {
    success: true,
    post_urn: readRestliId(response.headers),
  };
};

export const publishMemberPost = async ({
  accessToken,
  idToken,
  text,
  visibility,
  imageFile,
  imageUrn,
  link,
  linkTitle,
  linkDescription,
}: {
  accessToken: string;
  idToken: string;
  text: string;
  visibility: string;
  imageFile?: ApFile;
  imageUrn?: string;
  link?: string;
  linkTitle?: string;
  linkDescription?: string;
}): Promise<PostCreationResult> => {
  const shortUrn = getMemberUrn(idToken).substring('urn:li:'.length);
  let image: Image | undefined;
  if (imageFile) {
    image = await linkedinCommon.uploadImage(accessToken, shortUrn, imageFile);
  }
  const body = linkedinCommon.generatePostRequestBody({
    urn: shortUrn,
    text: santizeText(text),
    link,
    linkTitle,
    linkDescription,
    visibility,
    image,
    imageUrn,
  });
  return await createLinkedinPost({ accessToken, body });
};

export const publishOrganizationPost = async ({
  accessToken,
  organizationId,
  text,
  imageFile,
  imageUrn,
  link,
  linkTitle,
  linkDescription,
}: {
  accessToken: string;
  organizationId: string;
  text: string;
  imageFile?: ApFile;
  imageUrn?: string;
  link?: string;
  linkTitle?: string;
  linkDescription?: string;
}): Promise<PostCreationResult> => {
  const shortUrn = `organization:${organizationId}`;
  let image: Image | undefined;
  if (imageFile) {
    image = await linkedinCommon.uploadImage(accessToken, shortUrn, imageFile);
  }
  const body = linkedinCommon.generatePostRequestBody({
    urn: shortUrn,
    text: santizeText(text),
    link,
    linkTitle,
    linkDescription,
    visibility: 'PUBLIC',
    image,
    imageUrn,
  });
  return await createLinkedinPost({ accessToken, body });
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

export interface PostCreationResult {
  success: boolean;
  post_urn: string | null;
}

export interface LinkedinCompany {
  id: number;
  localizedName: string;
}

interface OrganizationalEntityAclsResponse {
  elements?: { organizationalTarget: string }[];
}

interface OrganizationsLookupResponse {
  results?: Record<string, LinkedinCompany>;
}

export const MAX_ERROR_BODY_CHARS = 200;
