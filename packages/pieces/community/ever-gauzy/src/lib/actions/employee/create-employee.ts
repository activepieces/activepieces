import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { gauzyAuth } from '../../../index';
import { getAuthHeaders, getBaseUrl, LanguagesEnum } from '../../common';

export const createEmployee = createAction({
  auth: gauzyAuth,
  name: 'create_employee',
  displayName: 'Create Employee',
  description: 'Create a new employee in Gauzy',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    roleId: Property.ShortText({
      displayName: 'Role ID',
      required: false,
    }),
    role: Property.ShortText({
      displayName: 'Role',
      required: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: true,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: true,
    }),
    imageUrl: Property.ShortText({
      displayName: 'Image URL',
      required: false,
    }),
    preferredLanguage: Property.StaticDropdown({
      displayName: 'Preferred Language',
      required: false,
      defaultValue: LanguagesEnum.ENGLISH,
      options: {
        options: Object.values(LanguagesEnum).map((lang) => ({
          label: lang,
          value: lang,
        })),
      },
    }),
    userId: Property.ShortText({
      displayName: 'User ID',
      required: false,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      required: false,
    }),
  },
  async run(context) {
    const baseUrl = getBaseUrl(context.auth);
    const headers = getAuthHeaders(context.auth);

    const body = {
      user: {
        email: context.propsValue.email,
        roleId: context.propsValue.roleId,
        role: context.propsValue.role,
        firstName: context.propsValue.firstName,
        lastName: context.propsValue.lastName,
        imageUrl: context.propsValue.imageUrl,
        preferredLanguage: context.propsValue.preferredLanguage || LanguagesEnum.ENGLISH,
      },
      userId: context.propsValue.userId,
      password: context.propsValue.password,
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseUrl}/api/employee`,
      headers,
      body,
    });

    return response.body;
  },
});
