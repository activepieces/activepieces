import { DynamicPropsValue, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { KizeoFormsDataUsers, KizeoFormsExports, KizeoFormsForms } from "./models";


const markdownDescription = `
To connect to Kizeo Forms, you need an API Token provided by our support team.
`
export const endpoint = 'https://forms.kizeo.com/rest/'
export const kizeoFormsCommon = {
  authentication: Property.SecretText({
    displayName: "Kizeo Forms API Key",
    required: true,
    description: markdownDescription
  }),

  formId: Property.Dropdown<string>({
    displayName: 'Form',
    required: true,
    refreshers: ["authentication"],
    options: async ({ authentication }) => {
      if (!authentication) {
        return {
          disabled: true,
          options: [],
          placeholder: "Please connect your account"
        }
      }

      try {
        const forms: KizeoFormsForms[] = await kizeoFormsCommon.fetchForms({
          token: authentication as string
        })

        if (forms) {
          return {
            disabled: false,
            options: forms.map(
              (forms) => ({ value: forms.id, label: forms.name })
            )
          }
        }
      } catch (e) {
        console.debug(e)

        return {
          disabled: true,
          options: [],
          placeholder: "Please check your permission scope"
        }
      }

      return {
        disabled: true,
        options: []
      }
    }
  }),
  userId: Property.Dropdown<string>({
    displayName: 'User',
    required: true,
    refreshers: ["authentication"],
    options: async ({ authentication }) => {
      if (!authentication) {
        return {
          disabled: true,
          options: [],
          placeholder: "Please connect your account"
        }
      }

      try {
        const dataUsers: KizeoFormsDataUsers = await kizeoFormsCommon.fetchUsers({
          token: authentication as string
        })
        if (dataUsers) {
          return {
            disabled: false,
            options: dataUsers.users.map(
              (users) => ({ value: users.id, label: users.first_name + " " + users.last_name })
            )
          }
        }
      } catch (e) {
        console.debug(e)

        return {
          disabled: true,
          options: [],
          placeholder: "Please check your permission scope"
        }
      }

      return {
        disabled: true,
        options: []
      }
    }
  }),
  exportId: Property.Dropdown<string>({
    displayName: 'Export',
    required: true,
    refreshers: ["authentication","formId"],
    options: async ({ authentication, formId }) => {
        if (!authentication){
            return {
                disabled: true,
                options: [],
                placeholder: "Please connect your account"
            }
        }
        if (!formId){
            return {
                disabled: true,
                options: [],
                placeholder: "Please select a form"
            }
        }
        try {
            const exportList: KizeoFormsExports[] = await kizeoFormsCommon.fetchExports({
                token: authentication as string,
                formId: formId as unknown as string
            })
            if (exportList) {

                return {
                    disabled: false,
                    options: exportList.map(
                        (exportItem) => ({ value: exportItem.id, label: exportItem.name })
                    )
                }
            }
        } catch (e) {
            console.debug(e)

            return {
            disabled: true,
            options: [],
            placeholder: "Please check your permission scope"
            }
        }

        return {
            disabled: true,
            options: []
        }
    }
  }),
  fields: Property.DynamicProperties({
    displayName: 'Form',
    required: true,
    refreshers: ["authentication", "formId"],

    props: async ({ authentication, formId }) => {
        if (!authentication) return {}
        if (!formId) return {}

        const fields: DynamicPropsValue = {};

        try {
            const form: KizeoFormsForms = await kizeoFormsCommon.fetchForm({
                token: authentication as unknown as string,
                formId: formId as unknown as string
            });

            const results: Record<string, any> = form.fields;

            for (let i = 0; i < Object.keys(results).length; i++) {
                const fieldId = Object.keys(results)[i];

                if (Object.values(results)[i].type === 'text') {
                    fields[fieldId] = Property.ShortText({
                        displayName: Object.values(results)[i].caption,
                        required: Object.values(results)[i].required
                    })
                }
            }
        } catch (e) {
            console.debug(e)
        }

        return fields
    }
  }),

  async fetchForms({ token }: { token: string }): Promise<KizeoFormsForms[]> {
    const response = await httpClient.sendRequest<{ forms: KizeoFormsForms[] }>({
      method: HttpMethod.GET,
      url: endpoint + `v3/forms`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
    })

    if (response.status === 200) {
      return response.body.forms
    }

    return []
  },
  async fetchUsers({ token }: { token: string }): Promise<KizeoFormsDataUsers> {
    const response = await httpClient.sendRequest<{ data: KizeoFormsDataUsers }>({
      method: HttpMethod.GET,
      url: endpoint + `v3/users`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
    })

    if (response.status === 200) {
      return response.body.data
    }
    return { users:[]}
    },
  async fetchForm({ token, formId }: { token: string, formId: string }): Promise<KizeoFormsForms> {
    const response = await httpClient.sendRequest<{ form: KizeoFormsForms }>({
      method: HttpMethod.GET,
      url: endpoint + `v3/forms/${formId}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
    })

    if (response.status === 200) {
        return response.body.form;
    } else {
        throw new Error(`Failed to fetch form ${formId}`);
    }
  },
async fetchExports({ token, formId }: { token: string, formId: string }): Promise<KizeoFormsExports[]> {
    const response = await httpClient.sendRequest<{ exports: KizeoFormsExports[] }>({
      method: HttpMethod.GET,
      url: endpoint + `v3/forms/${formId}/exports?used-with-n8n=`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
    })
    if (response.status === 200) {
        return response.body.exports;
    } else {
        throw new Error(`Failed to fetch exports ${formId}`);
    }
  },
}
