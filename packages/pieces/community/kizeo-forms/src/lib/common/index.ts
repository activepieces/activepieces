import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import {
  KizeoFormsDataUsers,
  KizeoFormsExports,
  KizeoFormsForms,
  KizeoFormsList,
  KizeoFormsLists,
} from './models';

export const endpoint = 'https://forms.kizeo.com/rest/';
export const kizeoFormsCommon = {
  formId: Property.Dropdown<string>({
    displayName: 'Form',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account',
        };
      }

      try {
        const forms: KizeoFormsForms[] = await kizeoFormsCommon.fetchForms({
          token: auth as string,
        });

        if (forms) {
          return {
            disabled: false,
            options: forms.map((forms) => ({
              value: forms.id,
              label: forms.name,
            })),
          };
        }
      } catch (e) {
        console.debug(e);

        return {
          disabled: true,
          options: [],
          placeholder: 'Please check your permission scope',
        };
      }

      return {
        disabled: true,
        options: [],
      };
    },
  }),
  userId: Property.Dropdown<string>({
    displayName: 'User',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account',
        };
      }

      try {
        const dataUsers: KizeoFormsDataUsers =
          await kizeoFormsCommon.fetchUsers({
            token: auth as string,
          });
        if (dataUsers) {
          return {
            disabled: false,
            options: dataUsers.users.map((users) => ({
              value: users.id,
              label: users.first_name + ' ' + users.last_name,
            })),
          };
        }
      } catch (e) {
        console.debug(e);

        return {
          disabled: true,
          options: [],
          placeholder: 'Please check your permission scope',
        };
      }

      return {
        disabled: true,
        options: [],
      };
    },
  }),
  exportId: Property.Dropdown<string>({
    displayName: 'Export',
    required: true,
    refreshers: ['formId'],
    options: async ({ auth, formId }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account',
        };
      }
      if (!formId) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a form',
        };
      }
      try {
        const exportList: KizeoFormsExports[] =
          await kizeoFormsCommon.fetchExports({
            token: auth as string,
            formId: formId as string,
          });
        if (exportList) {
          return {
            disabled: false,
            options: exportList.map((exportItem) => ({
              value: exportItem.id,
              label: exportItem.name,
            })),
          };
        }
      } catch (e) {
        console.debug(e);

        return {
          disabled: true,
          options: [],
          placeholder: 'Please check your permission scope',
        };
      }

      return {
        disabled: true,
        options: [],
      };
    },
  }),
  fields: Property.DynamicProperties({
    displayName: 'Form',
    required: true,
    refreshers: ['formId'],

    props: async ({ auth, formId }) => {
      if (!auth) return {};
      if (!formId) return {};

      const fields: DynamicPropsValue = {};

      try {
        const form: KizeoFormsForms = await kizeoFormsCommon.fetchForm({
          token: auth as unknown as string,
          formId: formId as unknown as string,
        });

        const results: Record<string, any> = form.fields;

        for (let i = 0; i < Object.keys(results).length; i++) {
          const fieldId = Object.keys(results)[i];

          if (Object.values(results)[i].type === 'text') {
            fields[fieldId] = Property.ShortText({
              displayName: Object.values(results)[i].caption,
              required: Object.values(results)[i].required,
            });
          }
        }
      } catch (e) {
        console.debug(e);
      }

      return fields;
    },
  }),
  listId: Property.Dropdown<string>({
    displayName: 'List',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account',
        };
      }

      try {
        const lists: KizeoFormsLists[] = await kizeoFormsCommon.fetchLists({
          token: auth as string,
        });

        if (lists) {
          return {
            disabled: false,
            options: lists.map((lists) => ({
              value: lists.id,
              label: lists.name,
            })),
          };
        }
      } catch (e) {
        console.debug(e);

        return {
          disabled: true,
          options: [],
          placeholder: 'Please check your permission scope',
        };
      }

      return {
        disabled: true,
        options: [],
      };
    },
  }),
  listProperties: Property.DynamicProperties({
    displayName: 'List',
    required: true,
    refreshers: ['listId'],

    props: async ({ auth, listId }) => {
      if (!auth) return {};
      if (!listId) return {};

      const properties: DynamicPropsValue = {};

      try {
        const list: KizeoFormsList = await kizeoFormsCommon.fetchList({
          token: auth as unknown as string,
          listId: listId as unknown as string,
        });

        const results: Record<string, any> = list.properties_definition;

        for (let i = 0; i < Object.keys(results).length; i++) {
          const propertyId = Object.keys(results)[i];

          if (Object.values(results)[i].type === 'string') {
            properties[propertyId] = Property.ShortText({
              displayName: Object.values(results)[i].display_name,
              required: false,
            });
          } else {
            properties[propertyId] = Property.Number({
              displayName: Object.values(results)[i].display_name,
              required: false,
            });
          }
        }
      } catch (e) {
        console.debug(e);
      }

      return properties;
    },
  }),

  async fetchForms({ token }: { token: string }): Promise<KizeoFormsForms[]> {
    const response = await httpClient.sendRequest<{ forms: KizeoFormsForms[] }>(
      {
        method: HttpMethod.GET,
        url: endpoint + `v3/forms?used-with-activepieces=`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
      }
    );

    if (response.status === 200) {
      return response.body.forms;
    }

    return [];
  },
  async fetchUsers({ token }: { token: string }): Promise<KizeoFormsDataUsers> {
    const response = await httpClient.sendRequest<{
      data: KizeoFormsDataUsers;
    }>({
      method: HttpMethod.GET,
      url: endpoint + `v3/users?used-with-activepieces=`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
    });

    if (response.status === 200) {
      return response.body.data;
    }
    return { users: [] };
  },
  async fetchForm({
    token,
    formId,
  }: {
    token: string;
    formId: string;
  }): Promise<KizeoFormsForms> {
    const response = await httpClient.sendRequest<{ form: KizeoFormsForms }>({
      method: HttpMethod.GET,
      url: endpoint + `v3/forms/${formId}?used-with-activepieces=`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
    });

    if (response.status === 200) {
      return response.body.form;
    } else {
      throw new Error(`Failed to fetch form ${formId}`);
    }
  },
  async fetchExports({
    token,
    formId,
  }: {
    token: string;
    formId: string;
  }): Promise<KizeoFormsExports[]> {
    const response = await httpClient.sendRequest<{
      exports: KizeoFormsExports[];
    }>({
      method: HttpMethod.GET,
      url: endpoint + `v3/forms/${formId}/exports?used-with-activepieces=`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
    });
    if (response.status === 200) {
      return response.body.exports;
    } else {
      throw new Error(`Failed to fetch exports ${formId}`);
    }
  },
  async fetchLists({ token }: { token: string }): Promise<KizeoFormsLists[]> {
    const response = await httpClient.sendRequest<{ lists: KizeoFormsLists[] }>(
      {
        method: HttpMethod.GET,
        url: endpoint + `v3/lists?used-with-activepieces=`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
      }
    );

    if (response.status === 200) {
      return response.body.lists;
    }

    return [];
  },
  async fetchList({
    token,
    listId,
  }: {
    token: string;
    listId: string;
  }): Promise<KizeoFormsList> {
    const response = await httpClient.sendRequest<{ list: KizeoFormsList }>({
      method: HttpMethod.GET,
      url:
        endpoint +
        `public/v4/lists/${listId}/definition?used-with-activepieces=`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
    });

    if (response.status === 200) {
      const list: KizeoFormsList = response.body as unknown as KizeoFormsList;
      return list;
    } else {
      throw new Error(`Failed to fetch form ${listId}`);
    }
  },
};
