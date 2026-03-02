import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { gauzyAuth, getAuthHeaders, getBaseUrl, LanguagesEnum, dynamicProps } from '../../common';

export const createEmployee = createAction({
  auth: gauzyAuth,
  name: 'create_employee',
  displayName: 'Create Employee',
  description: 'Create a new employee in Gauzy',
  props: {
    organizationId: dynamicProps.organizations,
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
      description: 'Employee email address',
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: true,
      description: 'Employee first name',
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: true,
      description: 'Employee last name',
    }),
    roleId: dynamicProps.roles,
    imageUrl: Property.ShortText({
      displayName: 'Profile Image URL',
      required: false,
      description: 'URL to employee profile picture',
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
    password: Property.ShortText({
      displayName: 'Password',
      required: false,
      description: 'Initial password for the employee account (optional)',
    }),
  },
  async run(context) {
    const baseUrl = getBaseUrl(context.auth);
    const headers = getAuthHeaders(context.auth);

    const body = {
      user: {
        email: context.propsValue.email,
        firstName: context.propsValue.firstName,
        lastName: context.propsValue.lastName,
        imageUrl: context.propsValue.imageUrl,
        preferredLanguage: context.propsValue.preferredLanguage || LanguagesEnum.ENGLISH,
        ...(context.propsValue.roleId ? { roleId: context.propsValue.roleId } : {}),
      },
      organizationId: context.propsValue.organizationId,
      ...(context.propsValue.password ? { password: context.propsValue.password } : {}),
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
