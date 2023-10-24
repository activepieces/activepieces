import Airtable from "airtable";
import { Property, DynamicPropsValue } from "@activepieces/pieces-framework";
import { HttpMethod, AuthenticationType, httpClient, HttpRequest } from "@activepieces/pieces-common";
import { AirtableBase, AirtableEnterpriseFields, AirtableField, AirtableFieldMapping, AirtableRecord, AirtableTable , AirtableFieldType} from "./models";
import { isNil } from "lodash";

export const airtableCommon = {
  base: Property.Dropdown({
    displayName: 'Base',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
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
            token: auth as string
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
    refreshers: ["base"],
    options: async ({ auth, base }) => {
      if (!auth) {
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
          token: auth as string,
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
    refreshers: ["base", "tableId"],
    
    props: async ({ auth, base, tableId }) => {
      if (!auth) return {}
      if (!base) return {}
      if (!tableId) return {}

      const fields: DynamicPropsValue = {};

      try {
        const airtable: AirtableTable = await airtableCommon.fetchTable({
          token: auth as unknown as string,
          baseId: base as unknown as string,
          tableId: tableId as unknown as string
        });

        airtable.fields.forEach((field: AirtableField) => {
          if (!AirtableEnterpriseFields.includes(field.type)){
            const params = {
              displayName: field.name,
              description: (
                (['date', 'dateTime'].includes(field.type))
                  ? `${field.description? field.description : ''}Expected format: mmmm d,yyyy`
                  : field.description
              ),
              required: false
            }
            if( isNil(AirtableFieldMapping[field.type]) ){
              fields[field.id] = Property.ShortText({
                ...params,
              })
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
          } 
        })
      } catch (e) {
        console.debug(e)
      }

      return fields
    }
  }),
  
  async createNewFields( auth : string , base : string , tableId : string , fields : Record<string,unknown>){
    if( !auth ) return fields;
    if( !base ) return fields;
    if( !tableId ) return fields;

 
    const newFields : Record<string,unknown> = {};

    try{
      const airtable: AirtableTable = await airtableCommon.fetchTable({
        token: auth,
        baseId: base,
        tableId: tableId
      });

      airtable.fields.forEach((field) => {
        if ( !AirtableEnterpriseFields.includes(field.type) ){
          const key = field.id;
          if( field.type === "multipleAttachments" )
          {
            newFields[key] = [
              {
                url: fields[key] as string,
              }
            ];
          }
          else
          {
             newFields[key] = fields[key];
          }
       
        }
      });
    }catch(e){
      console.debug(e);
    }
    return newFields;
  },
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
