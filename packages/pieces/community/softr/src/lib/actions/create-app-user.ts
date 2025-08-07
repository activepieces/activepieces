import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { SoftrAuth } from '../common/auth';

export const createAppUser = createAction({
  auth: SoftrAuth,
  name: 'createAppUser',
  displayName: 'Create App User',
  description: 'Creates a new user inside a Softr app.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the new user.',
      required: true,
    }),
    full_name: Property.ShortText({
      displayName: 'Name',
      description: 'The full name of the new user.',
      required: true,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      description: 'The password for the new user.',
      required: true,
    }),
    domain: Property.ShortText({
      displayName: 'Domain',
      description:
        'The domain or subdomain of the Softr app where the user will be created.',
      required: true,
    }),
    generate_magic_link: Property.Checkbox({
      displayName: 'Generate Magic Link',
      description: 'If checked, a magic link will be generated for the user.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { email, full_name, password, generate_magic_link, domain } =
      propsValue;

    // Build the request body
    const requestBody: any = {
      email,
      full_name,
      password,
      generate_magic_link,
    };

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `https://studio-api.softr.io/v1/api/users`,
        headers: {
          'Softr-Api-Key': auth,
          'Softr-Domain': domain,
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      return {
        success: true,
        user: response,
        message: 'User created successfully',
      };
    } catch (error: any) {
      throw new Error(
        `Failed to create user: ${error.message || String(error)}`
      );
    }
  },
});
