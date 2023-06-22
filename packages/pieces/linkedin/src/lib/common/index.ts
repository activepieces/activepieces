import { ApFile, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient, AuthenticationType } from "@activepieces/pieces-common";

import FormData from 'form-data';

export const linkedinCommon = {
    baseUrl: 'https://api.linkedin.com',
    linkedinHeaders: {
        'X-Restli-Protocol-Version': '2.0.0',
        // 'LinkedIn-Version': '202211'
    },

    authentication: Property.OAuth2({
        authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
        tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
        displayName: 'Authentication',
        required: true,
        scope: ['w_member_social', 'openid', 'email', 'profile', 'w_organization_social', 'rw_organization_admin']
    }),
    text: Property.LongText({
        displayName: 'Text',
        required: true
    }),
    imageUrl: Property.File({
        displayName: 'Image URL',
        required: false
    }),
    link: Property.ShortText({
        displayName: 'Link',
        required: false
    }),
    linkTitle: Property.ShortText({
        displayName: 'Content Title',
        required: false
    }),
    linkDescription: Property.ShortText({
        displayName: 'Content Description',
        required: false
    }),

    visibility: Property.Dropdown({
        displayName: 'Visibility',
        refreshers: [],
        required: true,
        options: async () => {
            return {
                options: [
                    {
                        label: "Public",
                        value: "PUBLIC",
                    },
                    {
                        label: "Connections Only",
                        value: "CONNECTIONS",
                    }
                ]
            }
        }
    }),

    company: Property.Dropdown({
        displayName: 'Company Page',
        required: true,
        refreshers: ['authentication'],
        options: async (props) => {
            if (!props['authentication']) {
                return {
                    disabled: true,
                    placeholder: 'Connect your account',
                    options: []
                }
            }
            const auth = props['authentication'] as { access_token: string };

            const companies: any = await linkedinCommon.getCompanies(auth.access_token);
            const options = [];
            for (const company in companies) {
                options.push({
                    label: companies[company].localizedName,
                    value: companies[company].id
                })
            }

            return {
                options: options
            }
        }
    }),

    getCompanies: async (accessToken: string) => {
        const companies = (await httpClient.sendRequest({
            url: `${linkedinCommon.baseUrl}/v2/organizationalEntityAcls`,
            method: HttpMethod.GET,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: accessToken
            },
            queryParams: {
                q: 'roleAssignee'
            }
        })).body;

        const companyIds = companies.elements.map((company: { organizationalTarget: string }) => {
            return company.organizationalTarget.substr(company.organizationalTarget.lastIndexOf(':') + 1);
        })

        const companySearch = (await httpClient.sendRequest({
            url: `${linkedinCommon.baseUrl}/v2/organizations?ids=List(${companyIds.join(',')})`,
            method: HttpMethod.GET,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: accessToken
            },
            headers: linkedinCommon.linkedinHeaders
        })).body

        return companySearch.results;
    },

    generatePostRequestBody: (data: {
        urn: string,
        text?: string | undefined,
        link?: string | undefined,
        linkTitle?: string | undefined,
        linkDescription?: string | undefined,
        visibility: string,
        image?: Asset | undefined
    }) => {
        const requestObject: UgcPost = {
            author: `urn:li:${data.urn}`,
            lifecycleState: 'PUBLISHED',
            specificContent: {
                "com.linkedin.ugc.ShareContent": {
                    shareCommentary: {},
                    shareMediaCategory: '',
                },
            },
            visibility: {
                "com.linkedin.ugc.MemberNetworkVisibility": data.visibility
            }
        }

        if (data.text) {
            requestObject.specificContent["com.linkedin.ugc.ShareContent"].shareCommentary.text = data.text;
        }

        if (data.image) {
            requestObject.specificContent["com.linkedin.ugc.ShareContent"].shareMediaCategory = 'IMAGE'
            requestObject.specificContent["com.linkedin.ugc.ShareContent"].media = [
                {
                    status: 'READY',
                    description: {
                        text: data.linkDescription ?? ''
                    },
                    media: data.image.value.asset,
                    title: {
                        text: data.linkTitle ?? ''
                    }
                }
            ]
        }
        else if (data.link) {
            requestObject.specificContent["com.linkedin.ugc.ShareContent"].shareMediaCategory = 'ARTICLE'
            requestObject.specificContent["com.linkedin.ugc.ShareContent"].media = [
                {
                    status: 'READY',
                    description: {
                        text: data.linkDescription ?? ''
                    },
                    originalUrl: data.link,
                    title: {
                        text: data.linkTitle ?? ''
                    }
                }
            ]
        }
        else {
            requestObject.specificContent["com.linkedin.ugc.ShareContent"].shareMediaCategory = 'NONE'
        }

        return requestObject;
    },

    uploadImage: async (accessToken: string, urn: string, image: ApFile): Promise<Asset> => {
        const uploadData = (await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${linkedinCommon.baseUrl}/v2/assets`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: accessToken
            },
            queryParams: {
                action: 'registerUpload'
            },
            body: {
                registerUploadRequest: {
                    recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
                    owner: `urn:li:${urn}`,
                    serviceRelationships: [
                        {
                            relationshipType: 'OWNER',
                            identifier: 'urn:li:userGeneratedContent'
                        }
                    ]
                }
            }
        })).body as Asset;

        const uploadFormData = new FormData();
        const { filename, base64 } = image;
        uploadFormData.append('file', Buffer.from(base64, "base64"), filename);

        await httpClient.sendRequest({
            url: uploadData.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl,
            method: HttpMethod.POST,
            body: uploadFormData,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: accessToken
            },
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return uploadData;
    },
}

export interface LinkedinJwtObject {
    iss: string
    aud: string
    iat: number
    exp: number
    sub: string
    name: string
    given_name: string
    family_name: string
    picture: string
    email: string
    email_verified: string
    locale: string
}

export interface UgcPost {
    author: string
    lifecycleState: string
    specificContent: {
        "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
                text?: string
            }
            shareMediaCategory: string
            media?: [
                {
                    status: string
                    description?: {
                        text: string
                    }
                    originalUrl?: string
                    media?: string
                    title?: {
                        text: string
                    }
                }
            ]
        }
    }
    visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": string
    }
}

export interface Asset {
    value: {
        uploadMechanism: {
            "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest": {
                headers: object,
                uploadUrl: string
            }
        },
        mediaArtifact: string,
        asset: string
    }
}