import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import * as properties from './properties';
import * as schemas from './schemas';
import {
    GetCompanyDataParams,
    GetProfileDataParams,
    ParseResumeParams,
    ReviewResumeParams,
    ScoreResumeParams,
} from './types';

export const magicalapiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    '1 - Log in to Your Account\
    Go to the MagicalAPI Dashboard and sign in to access your account.\
\
2 - Navigate to API Info\
Once logged in, find the API Info tab in the left sidebar or click API Keys in the top navigation.\
\
3 - Create an API Key\
In the API Info section:\
\
    - Click "Create API Key"\
    - Enter a title for your key (for tracking purposes)\
    - Note: You can have up to 5 active API keys\
\
4 - Save Your API Key\
After creation, your API key will be displayed once. Make sure to:\
\
    - Copy the key immediately\
    - Store it securely\
    - Never share it with others\
',
  required: true,
});

export const magicalapiCommon = {
  // API data
  baseUrl: 'https://gw.magicalapi.com',
  getHeaders: (apiKey: string) => ({
    'Content-type': 'application/json',
    'api-key': apiKey,
  }),
  endpoints: {
    parseResume: '/resume-parser',
    reviewResume: '/resume-review',
    getProfileData: '/profile-data',
    getCompanyData: '/company-data',
    scoreResume: '/resume-scoring',
  },

  // Properties
  parseResumeProperties: properties.parseResume,
  reviewResumeProperties: properties.reviewResume,
  getProfileDataProperties: properties.getProfileData,
  getCompanyDataProperties: properties.getCompanyData,
  scoreResumeProperties: properties.scoreResume,

  // Schemas
  parseResumeSchema: schemas.parseResume,
  reviewResumeSchema: schemas.reviewResume,
  getProfileDataSchema: schemas.getProfileData,
  getCompanyDataSchema: schemas.getCompanyData,
  scoreResumeSchema: schemas.scoreResume,
  checkResultSchema: schemas.checkResult,

  // Methods
  parseResume: async ({ apiKey, ...resumeParams }: ParseResumeParams) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${magicalapiCommon.baseUrl}${magicalapiCommon.endpoints.parseResume}`,
      headers: magicalapiCommon.getHeaders(apiKey),
      body: { ...resumeParams },
    });
    return response.body;
  },
  reviewResume: async ({ apiKey, ...resumeParams }: ReviewResumeParams) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${magicalapiCommon.baseUrl}${magicalapiCommon.endpoints.reviewResume}`,
      headers: magicalapiCommon.getHeaders(apiKey),
      body: { ...resumeParams },
    });
    return response.body;
  },
  getProfileData: async ({ apiKey, ...profileParams }: GetProfileDataParams) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${magicalapiCommon.baseUrl}${magicalapiCommon.endpoints.getProfileData}`,
      headers: magicalapiCommon.getHeaders(apiKey),
      body: { ...profileParams },
    });
    return response.body;
  },
  getCompanyData: async ({
    apiKey,
    ...companyParams
  }: GetCompanyDataParams) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${magicalapiCommon.baseUrl}${magicalapiCommon.endpoints.getCompanyData}`,
      headers: magicalapiCommon.getHeaders(apiKey),
      body: { ...companyParams },
    });
    return response.body;
  },
  scoreResume: async ({ apiKey, ...requestParams }: ScoreResumeParams) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${magicalapiCommon.baseUrl}${magicalapiCommon.endpoints.scoreResume}`,
      headers: magicalapiCommon.getHeaders(apiKey),
      body: { ...requestParams },
    });
    return response.body;
  },
};
