import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

export const intercomCommon = {
  intercomHeaders: {
    'Intercom-Version': '2.8',
  },
  getContact: async (req: { userId: string; token: string }) => {
    return (
      await httpClient.sendRequest<{ id: string; role: string }>({
        method: HttpMethod.GET,
        url: `https://api.intercom.io/contacts/${req.userId}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: req.token as string,
        },
      })
    ).body;
  },
};
