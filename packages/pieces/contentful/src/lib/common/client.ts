import { ContentfulAuth } from './auth';
import * as Contentful from 'contentful-management';

export const makeClient = (auth: ContentfulAuth) => {
  return {
    client: Contentful.createClient(
      { accessToken: auth.apiKey },
      {
        type: 'plain',
        defaults: { spaceId: auth.space, environmentId: auth.environment },
      }
    ),
  };
};
