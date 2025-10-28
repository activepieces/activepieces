import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import {
  DropdownState,
  DynamicPropsValue,
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { vtigerAuth } from '../..';
import {
  instanceLogin,
  VTigerAuthValue,
  Modules,
  Field,
  getRecordReference,
} from '../common';
import { elementTypeProperty } from '../common';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const updateRecord = createAction({
  name: 'update_record',
  auth: vtigerAuth,
  displayName: 'Update Record',
  description: 'Update a Record',
  props: {
    elementType: elementTypeProperty,
    id: Property.Dropdown({
      displayName: 'Id',
      description: "The record's id",
      required: true,
      refreshers: ['elementType'],
      options: async ({ auth, elementType }) => {
        if (!auth || !elementType) {
          return {
            disabled: true,
            options: [],
            placeholder:
              'Please select the element type and setup authentication to continue.',
          };
        }

        let c = 0;
        let instance = null;
        while (!instance && c < 3) {
          instance = await instanceLogin(
            (auth as VTigerAuthValue).instance_url,
            (auth as VTigerAuthValue).username,
            (auth as VTigerAuthValue).password
          );
          await sleep(1500);
          c++;
        }

        if (!instance) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Authentication failed.',
          };
        }

        const response = await httpClient.sendRequest<{
          success: boolean;
          result: Record<string, string>[];
        }>({
          method: HttpMethod.GET,
          url: `${(auth as VTigerAuthValue)['instance_url']}/webservice.php`,
          queryParams: {
            sessionName: instance.sessionId ?? instance.sessionName,
            operation: 'query',
            elementType: elementType as unknown as string,
            query: `SELECT * FROM ${elementType} LIMIT 100;`,
          },
        });

        if (!response.body.success)
          return {
            disabled: true,
            options: [],
            placeholder: 'Request unsuccessful.',
          };

        const element: string = elementType as unknown as string;

        return {
          options: await Promise.all(response.body.result.map(async (record) => {
            return {
              label: await Modules[element]?.(record) || record['id'],
              value: record['id'] as string,
            };
          })),
          disabled: false,
        };
      },
    }),
    record: Property.DynamicProperties({
      displayName: 'Record Fields',
      description: 'Add new fields to be created in the new record',
      required: true,
      refreshers: ['id', 'elementType'],
      props: async ({ auth, id, elementType }) => {
        if (!auth || !elementType) {
          return {};
        }

        const instance = await instanceLogin(
          auth['instance_url'],
          auth['username'],
          auth['password']
        );
        if (!instance) return {};

        let defaultValue: Record<string, unknown>;
        if (id && 'id') {
          const retrieve_response = await httpClient.sendRequest<{
            success: boolean;
            result: Record<string, unknown>;
          }>({
            method: HttpMethod.GET,
            url: `${auth['instance_url']}/webservice.php`,
            queryParams: {
              operation: 'retrieve',
              sessionName: instance.sessionId ?? instance.sessionName,
              elementType: elementType as unknown as string,
              id: id as unknown as string,
            },
          });
          if (retrieve_response.body.result) {
            defaultValue = retrieve_response.body.result;
          } else {
            defaultValue = {};
          }
        } else {
          defaultValue = {};
        }

        const describe_response = await httpClient.sendRequest<{
          success: boolean;
          result: { fields: Field[] };
        }>({
          method: HttpMethod.GET,
          url: `${auth['instance_url']}/webservice.php`,
          queryParams: {
            sessionName: instance.sessionId ?? instance.sessionName,
            operation: 'describe',
            elementType: elementType as unknown as string,
          },
        });

        const fields: DynamicPropsValue = {};

        if (describe_response.body.success) {
          let limit = 30; // Limit to show 30 input property, more than this will cause frontend unresponsive

          const generateField = async (field: Field) => {
            const params = {
              displayName: field.label,
              description: `Field ${field.name} of object type ${elementType}`,
              required: field.mandatory,
            };

            if (
              [
                'string',
                'text',
                'mediumtext',
                'phone',
                'url',
                'email',
              ].includes(field.type.name)
            ) {
              if (['mediumtext', 'url'].includes(field.type.name)) {
                fields[field.name] = Property.LongText({
                  ...params,
                  defaultValue: defaultValue?.[field.name] as string,
                });
              } else {
                fields[field.name] = Property.ShortText({
                  ...params,
                  defaultValue: defaultValue?.[field.name] as string,
                });
              }
            } else if (
              ['picklist', 'reference', 'owner'].includes(field.type.name)
            ) {
              let options: DropdownState<string>;
              if (field.type.name === 'picklist') {
                options = {
                  disabled: false,
                  options: field.type.picklistValues ?? [],
                };
              } else if (field.type.name === 'owner') {
                options = await getRecordReference(
                  auth as PiecePropValueSchema<typeof vtigerAuth>,
                  ['Users']
                );
              } else if (field.type.refersTo) {
                options = await getRecordReference(
                  auth as PiecePropValueSchema<typeof vtigerAuth>,
                  field.type.refersTo ?? []
                );
              } else {
                options = { disabled: false, options: [] };
              }

              fields[field.name] = Property.StaticDropdown({
                ...params,
                defaultValue: defaultValue?.[field.name] as string,
                options,
              });
            } else if (
              ['double', 'integer', 'currency'].includes(field.type.name)
            ) {
              fields[field.name] = Property.Number({
                ...params,
                defaultValue: defaultValue?.[field.name] as number,
              });
            } else if (['boolean'].includes(field.type.name)) {
              fields[field.name] = Property.Checkbox({
                displayName: field.label,
                description: `The fields to fill in the object type ${elementType}`,
                required: field.mandatory,
                defaultValue: defaultValue?.[field.name] ? true : false,
              });
            } else if (['date', 'datetime', 'time'].includes(field.type.name)) {
              fields[field.name] = Property.DateTime({
                displayName: field.label,
                description: `The fields to fill in the object type ${elementType}`,
                defaultValue: defaultValue?.[field.name] as string,
                required: field.mandatory,
              });
            }
          };

          const skipFields = [
            'id',
          ];

          // Prioritize mandatory fields
          for (const field of describe_response.body.result.fields) {
            if (skipFields.includes(field.name)) {
              continue;
            }

            if (field.mandatory) {
              await generateField(field);
              limit--;
            }
          }

          // Let's add the rest...
          for (const field of describe_response.body.result.fields) {
            if (skipFields.includes(field.name)) {
              continue;
            }

            // Skip the rest of field to avoid unresponsive frontend
            if (limit < 0) break;

            if (!field.mandatory) {
              await generateField(field);
              limit--;
            }
          }
        }

        return fields;
      },
    }),
  },
  async run({ propsValue: { elementType, id, record }, auth }) {
    const instance = await instanceLogin(
      auth.instance_url,
      auth.username,
      auth.password
    );

    if (instance !== null) {
      const response = await httpClient.sendRequest<Record<string, unknown>[]>({
        method: HttpMethod.POST,
        url: `${auth.instance_url}/webservice.php`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: {
          operation: 'update',
          sessionName: instance.sessionId ?? instance.sessionName,
          elementType: elementType,
          element: JSON.stringify({
            id: id,
            ...record,
          }),
        },
      });

      console.debug({
        operation: 'update',
        sessionName: instance.sessionId ?? instance.sessionName,
        elementType: elementType,
        element: JSON.stringify({
          id: id,
          ...record,
        }),
      });

      return response.body;
    }

    return null;
  },
});
