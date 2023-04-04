import Airtable from "airtable";
import { Property, HttpRequest, HttpMethod, AuthenticationType, httpClient, DynamicPropsValue } from "@activepieces/framework";
import { AirtableBase, AirtableEnterpriseFields, AirtableField, AirtableFieldMapping, AirtableRecord, AirtableTable } from "./models";


const markdownDescription = `
To obtain your personal token, follow these steps:

1. Log in to your Airtable account.
2. Visit https://airtable.com/create/tokens/ to create one
3. Click on "+ Add a base" and select the base you want to use or all bases.
4. Click on "+ Add a scope" and select "data.records.read" and "schema.bases.read".
5. Click on "Create token" and copy the token.
`

export const airtableCommon = {
  authentication: Property.SecretText({
    displayName: "Personal Token",
    required: true,
    description: markdownDescription
  }),

  base: Property.Dropdown({
    displayName: 'Base',
    required: true,
    refreshers: ["authentication"],
    options: async (props) => {
      if (!props['authentication']) {
        return {
          disabled: true,
          options: [],
          placeholder: "Please connect your account"
        }
      }

      try {
        const response = await httpClient.sendRequest<{ bases: AirtableBase[] }>({
          method: HttpMethod.GET,
          url: "https://api.airtable.com/v0/meta/bases",
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: props["authentication"] as string
          }
        })
        if (response.status === 200) {
          return {
            disabled: false,
            options: response.body.bases.map((base) => {
              return { value: base.id, label: base.name };
            })
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

  tableId: Property.Dropdown<string>({
    displayName: 'Table',
    required: true,
    refreshers: ["authentication", "base"],
    options: async ({ authentication, base }) => {
      if (!authentication) {
        return {
          disabled: true,
          options: [],
          placeholder: "Please connect your account"
        }
      }
      if (!base) {
        return {
          disabled: true,
          options: [],
          placeholder: "Please select a base first"
        }
      }

      try {
        const tables: AirtableTable[] = await airtableCommon.fetchTableList({
          token: authentication as string,
          baseId: base as string
        })

        if (tables) {
          return {
            disabled: false,
            options: tables.map(
              (table) => ({ value: table.id, label: table.name })
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
    displayName: 'Table',
    required: true,
    refreshers: ["authentication", "base", "tableId"],

    props: async ({ authentication, base, tableId }) => {
      if (!authentication) return {}
      if (!base) return {}
      if (!tableId) return {}

      const fields: DynamicPropsValue = {};

      try {
        const airtable: AirtableTable = await airtableCommon.fetchTable({
          token: authentication as unknown as string,
          baseId: base as unknown as string,
          tableId: tableId as unknown as string
        });

        airtable.fields.map((field: AirtableField) => {
          //skip these types
          if (AirtableEnterpriseFields.includes(field.type)) return

          const params = {
            displayName: field.name,
            description: (
              (['date', 'dateTime'].includes(field.type))
                ? `${field.description}. Expected format: mmmm d,yyyy`
                : field.description
            ),
            required: false
          }

          if (field.type === "singleSelect" || field.type === "multipleSelects") {
            const options = field.options?.choices.map((option: { id: string, name: string }) => ({
              value: option.id,
              label: option.name
            }))

            fields[field.id] = (AirtableFieldMapping[field.type])({
              ...params,
              options: {
                options: options ?? []
              }
            })
          } else {
            fields[field.id] = (AirtableFieldMapping[field.type])(params)
          }
        })
      } catch (e) {
        console.debug(e)
      }

      return fields
    }
  }),


  async getTableSnapshot(params: Params) {
    Airtable.configure({
      apiKey: params.personalToken,
    });
    const airtable = new Airtable();
    const currentTablleSnapshot = (await airtable
      .base(params.baseId)
      .table(params.tableId)
      .select()
      .all()).map((r) => r._rawJson)
      .sort((x, y) => new Date(x.createdTime).getTime() - new Date(y.createdTime).getTime());
    return currentTablleSnapshot;
  },

  async fetchTableList({ token, baseId }: { token: string, baseId: string }): Promise<AirtableTable[]> {
    const response = await httpClient.sendRequest<{ tables: AirtableTable[] }>({
      method: HttpMethod.GET,
      url: `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token
      }
    })

    if (response.status === 200) {
      return response.body.tables
    }

    return []
  },

  async fetchTable({ token, baseId, tableId }: { token: string, baseId: string, tableId: string }) { 
    const response = await airtableCommon.fetchTableList({ token, baseId }); 
    return response.find(t => t.id === tableId)!; 
  },

  async createRecord({ personalToken: token, fields, tableId, baseId }: Params) {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://api.airtable.com/v0/${baseId}/${tableId}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token
      },
      body: {
        fields
      }
    }

    const response = await httpClient.sendRequest<AirtableRecord>(request);

    if (response.status === 200) {
      return response.body
    }

    return response
  }
}

interface Params {
  personalToken: string
  baseId: string
  tableId: string
  fields?: Record<string, unknown>
}