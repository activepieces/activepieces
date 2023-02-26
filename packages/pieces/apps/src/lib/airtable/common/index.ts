import Airtable from "airtable";
import { Property, HttpRequest, HttpMethod, AuthenticationType, httpClient } from "@activepieces/framework";
import { AirtableBase, AirtableFieldMapping, AirtableTable } from "./models";

export const airtableCommon = {
  authentication: Property.SecretText({
    displayName: "Personal Token",
    required: true,
    description: "Visit https://airtable.com/create/tokens/ to create one"
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
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: "https://api.airtable.com/v0/meta/bases",
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: props["authentication"] as string
        }
      };

      try {
        const response = await httpClient.sendRequest<{ bases: AirtableBase[] }>(request)
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

  table: Property.Dropdown({
    displayName: 'Table',
    required: true,
    refreshers: ["authentication", "base"],
    options: async (props) => {
      if (!props['authentication']) {
        return {
          disabled: true,
          options: [],
          placeholder: "Please connect your account"
        }
      }
      if (!props['base']) {
        return {
          disabled: true,
          options: [],
          placeholder: "Please select a base first"
        }
      }

      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `https://api.airtable.com/v0/meta/bases/${props['base']}/tables`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: props["authentication"] as string
        }
      }

      try {
        const response = await httpClient.sendRequest<{ tables: AirtableTable[] }>(request);
        if (response.status === 200) {
          return {
            disabled: false,
            options: response.body.tables.map((table) => {
              return { value: table, label: table.name };
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

  fields: Property.DynamicProperties({
    displayName: 'Table',
    required: true,
    refreshers: ["authentication", "base", "table"],

    props: async (props) => {
      const { authentication, base, table } = props

      if (!authentication) return {}
      if (!base) return {}
      if (!table) return {}

      const fields = (table as AirtableTable).fields.map((field) => {
        let params = {
          displayName: field.name,
          description: field.description,
          required: false
        }

        if (field.type === "singleSelect") {
          const options = field.options!.choices.map((option: { id: string, name: string }) => ({
            value: option.id,
            label: option.name
          }))

          return Property.StaticDropdown({
            ...params,
            options: {
              options
            }
          })
        }

        return (AirtableFieldMapping[field.type])(params)
      })

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

  async createRecord({personalToken: token, fields, tableId}: Params) {
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

    const response = await httpClient.sendRequest<{ tables: AirtableTable[] }>(request);
    console.debug("Create record response", response.body)
    
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
  fields: Record<string, unknown> 
}