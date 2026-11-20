import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const markdownPropertyDescription = `
Connect with a Drupal user account over JSON:API.

1. On your site, enable the **JSON:API** and **HTTP Basic Authentication** modules (both ship with Drupal core).
2. Create a user for Activepieces and give it the permissions your flows need.
3. Enter your site's address and that user's username and password below.

The Call Service action and the triggers also need the [Drupal Orchestration](https://www.drupal.org/project/orchestration) module.
`;

export const drupalAuth = PieceAuth.CustomAuth({
  description: markdownPropertyDescription,
  required: true,
  props: {
    website_url: Property.ShortText({
      displayName: 'Website URL',
      required: true,
      description: `Your site's address, without a trailing slash.`,
      placeholder: 'https://www.example.com',
    }),
    username: Property.ShortText({
      displayName: 'Username',
      required: true,
      description: 'The Drupal user Activepieces signs in as.',
    }),
    password: Property.ShortText({
      displayName: 'Password',
      required: true,
      description: `That user's password.`,
    }),
  },
  validate: async ({ auth }) => {
    const { website_url, username, password } = auth;
    if (!website_url || !username || !password) {
      return {
        valid: false,
        error: 'Enter the website URL, username and password.',
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
      if (response.status === 200) {
        const data = (response.body as any).data;
        if (data && data.length > 0 && data[0].attributes.name === username) {
          return { valid: true };
        }
        return {
          valid: false,
          error: 'Authentication failed. Please check your credentials.',
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
