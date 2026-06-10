import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const markdownPropertyDescription = `
**Using Drupal's JSON:API**

Your Drupal site comes with JSON:API built-in. Authentication to access relevant parts requires the HTTP Basic Authentication module, which is also part of your Drupal site. Just ensure both are enabled and configure user authentication:

1. Enable the JSON:API and the HTTP Basic Authentication modules
2. Create a user account and give it the permissions you want Activepieces to have
3. Use that account's credentials for authentication

Provide the website URL in the format https://www.example.com.

For extra functionality, you can use the [Drupal Orchestration](https://www.drupal.org/project/orchestration) module.
`;

export const drupalAuth = PieceAuth.CustomAuth({
  description: markdownPropertyDescription,
  required: true,
  props: {
    website_url: Property.ShortText({
      displayName: 'Website URL',
      required: true,
      description: 'URL of your Drupal site without a trailing "/" character',
    }),
    username: Property.ShortText({
      displayName: 'Username',
      required: true,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    const { website_url, username, password } = auth;
    if (!website_url || !username || !password) {
      return {
        valid: false,
        error: 'Please fill all the fields [website_url, username, password]',
      };
    }
    if (website_url.endsWith('/')) {
      return {
        valid: false,
        error: 'The website URL must not end with a trailing slash.',
      };
    }
    try {
      const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: website_url + `/jsonapi/user/user?filter[name]=` + username,
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Accept': 'application/vnd.api+json',
        },
      });
      console.debug('Auth validation response', response);
      if (response.status === 200) {
        const data = (response.body as any).data;
        return {
          valid: (data && data.length > 0 && data[0].attributes.name === username),
        };
      }
      return {
        valid: false,
        error: 'Authentication failed. Please check your credentials.',
      };
    } catch (e: any) {
      return {
        valid: false,
        error: 'Connection failed: ' + e.message,
      };
    }
  },
});
