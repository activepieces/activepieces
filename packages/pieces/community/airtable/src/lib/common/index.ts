import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import {
  DropdownState,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import Airtable from 'airtable';
import {
  AirtableBase,
  AirtableComment,
  AirtableCreateBaseResponse,
  AirtableTableConfig,
  AirtableFieldConfig,
  AirtableEnterpriseFields,
  AirtableField,
  AirtableFieldMapping,
  AirtableRecord,
  AirtableTable,
  AirtableView,
} from './models';
import { isNil } from '@activepieces/pieces-framework';
import { airtableAuth } from '../auth';

const MAX_FIND_RECORDS = 1000;


interface Params {
  personalToken: string;
  baseId: string;
  tableId: string;
  fields?: Record<string, unknown>;
  recordId?: string;
  searchValue?: string;
  searchField?: string;
  fieldNames?: string[];
  limitToView?: string;
  sortField?: string;
  text?: string; 
  parentCommentId?: string;
  workspaceId?: string; 
  name?: string; 
  tables?: AirtableTableConfig[];
}

async function fetchAllBases({
  token,
}: {
  token: string;
}): Promise<AirtableBase[]> {
  const allBases: AirtableBase[] = [];
  let offset: string | undefined = undefined;

  do {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: 'https://api.airtable.com/v0/meta/bases',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      },
      queryParams: offset ? { offset } : {},
    };
    const response = await httpClient.sendRequest<{
      bases: AirtableBase[];
      offset?: string;
    }>(request);

    if (response.status === 200) {
      allBases.push(...response.body.bases);
      offset = response.body.offset;
    } else {
      offset = undefined;
    }
  } while (offset);

  return allBases;
}

async function fetchBase({
  token,
  baseId,
}: {
  token: string;
  baseId: string;
}): Promise<AirtableBase> {
  const request: HttpRequest = {
    method: HttpMethod.GET,
    url: `https://api.airtable.com/v0/meta/bases/${baseId}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
  };
  const response = await httpClient.sendRequest<AirtableBase>(request);
  return response.body;
}

async function listRecords({
  token,
  baseId,
  tableId,
  pageSize = 100,
  maxRecords = 500,
}: {
  token: string;
  baseId: string;
  tableId: string;
  pageSize?: number;
  maxRecords?: number;
}): Promise<AirtableRecord[]> {
  const allRecords: AirtableRecord[] = [];
  let offset: string | undefined = undefined;

  do {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://api.airtable.com/v0/${baseId}/${tableId}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      },
      queryParams: {
        pageSize: pageSize.toString(),
        ...(offset ? { offset } : {}),
      },
    };
    const response = await httpClient.sendRequest<{
      records: AirtableRecord[];
      offset?: string;
    }>(request);

    if (response.status !== 200) {
      throw new Error(`Airtable returned ${response.status} while listing records`);
    }
    allRecords.push(...response.body.records);
    offset = response.body.offset;
  } while (offset && allRecords.length < maxRecords);

  return allRecords.slice(0, maxRecords);
}

async function fetchTableList({
  token,
  baseId,
}: {
  token: string;
  baseId: string;
}): Promise<AirtableTable[]> {
  const response = await httpClient.sendRequest<{ tables: AirtableTable[] }>({
    method: HttpMethod.GET,
    url: `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
  });

  if (response.status === 200) {
    return response.body.tables;
  }

  return [];
}

async function fetchTable({
  token,
  baseId,
  tableId,
}: {
  token: string;
  baseId: string;
  tableId: string;
}): Promise<AirtableTable> {
  const tables = await fetchTableList({ token, baseId });
  return tables.find((t) => t.id === tableId)!;
}

async function fetchViews({
  token,
  baseId,
  tableId,
}: {
  token: string;
  baseId: string;
  tableId: string;
}): Promise<AirtableView[]> {
  const table = await fetchTable({ token, baseId, tableId });
  if (table) {
    return table.views;
  }
  return [];
}

async function createRecord({
  personalToken: token,
  fields,
  tableId,
  baseId,
}: Params) {
  const request: HttpRequest = {
    method: HttpMethod.POST,
    url: `https://api.airtable.com/v0/${baseId}/${tableId}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
    body: {
      fields,
      typecast: true,
    },
  };

  const response = await httpClient.sendRequest<AirtableRecord>(request);

  if (response.status === 200) {
    return response.body;
  }

  return response;
}

async function findRecord({
  personalToken: token,
  searchField,
  searchValue,
  tableId,
  baseId,
  limitToView,
}: Params) {
  const escapedSearchValue = (searchValue ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
  const allRecords: AirtableRecord[] = [];
  let offset: string | undefined = undefined;

  do {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://api.airtable.com/v0/${baseId}/${tableId}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      },
      queryParams: {
        filterByFormula: `FIND("${escapedSearchValue}",{${searchField}})`,
        ...(limitToView ? { view: limitToView } : {}),
        ...(offset ? { offset } : {}),
      },
    };

    const response = await httpClient.sendRequest<{
      records: AirtableRecord[];
      offset?: string;
    }>(request);

    if (response.status !== 200) {
      throw new Error(`Airtable returned ${response.status} while listing records`);
    }
    allRecords.push(...response.body.records);
    offset = response.body.offset;
  } while (offset && allRecords.length < MAX_FIND_RECORDS);

  return allRecords.slice(0, MAX_FIND_RECORDS);
}
async function updateRecord({
  personalToken: token,
  fields,
  recordId,
  tableId,
  baseId,
}: Params) {
  const request: HttpRequest = {
    method: HttpMethod.PATCH,
    url: `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
    body: {
      fields,
    },
  };

  const response = await httpClient.sendRequest<AirtableRecord>(request);

  if (response.status === 200) {
    return response.body;
  }

  return response;
}

async function deleteRecord({
  personalToken: token,
  recordId,
  tableId,
  baseId,
}: Params) {
  const request: HttpRequest = {
    method: HttpMethod.DELETE,
    url: `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
  };

  const response = await httpClient.sendRequest<AirtableRecord>(request);

  if (response.status === 200) {
    return response.body;
  }

  return response;
}

async function getRecordById({
  personalToken: token,
  baseId,
  tableId,
  recordId,
}: Params) {
  const request: HttpRequest = {
    method: HttpMethod.GET,
    url: `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
  };

  const response = await httpClient.sendRequest<AirtableRecord>(request);

  if (response.status === 200) {
    return response.body;
  }

  return response;
}

async function addCommentToRecord({
  personalToken: token,
  baseId,
  tableId,
  recordId,
  text,
  parentCommentId,
}: Params) {
  const body: { text: string; parentCommentId?: string } = {
    text: text as string,
  };
  if (parentCommentId) {
    body.parentCommentId = parentCommentId;
  }

  const request: HttpRequest = {
    method: HttpMethod.POST,
    url: `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}/comments`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
    body: body,
  };

  const response = await httpClient.sendRequest<AirtableComment>(request);

  if (response.status === 200 || response.status === 201) {
    return response.body;
  }
  return response;
}

async function createBase({
  personalToken: token,
  workspaceId,
  name,
  tables,
}: {
  personalToken: string;
  workspaceId: string;
  name: string;
  tables: AirtableTableConfig[];
}) {
  const request: HttpRequest = {
    method: HttpMethod.POST,
    url: `https://api.airtable.com/v0/meta/bases`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
    body: {
      name,
      workspaceId,
      tables,
    },
  };

  const response =
    await httpClient.sendRequest<AirtableCreateBaseResponse>(request);

  if (response.status === 200 || response.status === 201) {
    return response.body;
  }
  return response;
}

async function createTable({
  personalToken: token,
  baseId,
  name,
  description,
  fields,
}: {
  personalToken: string;
  baseId: string;
  name: string;
  description?: string;
  fields: AirtableFieldConfig[];
}) {
  const body: {
    name: string;
    description?: string;
    fields: AirtableFieldConfig[];
  } = { name, fields };

  if (description) {
    body.description = description;
  }

  const request: HttpRequest = {
    method: HttpMethod.POST,
    url: `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
    body: body,
  };

  const response = await httpClient.sendRequest<AirtableTable>(request);

  if (response.status === 200 || response.status === 201) {
    return response.body;
  }
  return response;
}

export const airtableCommon = {
  base: Property.Dropdown<string,true,typeof airtableAuth>({
    auth: airtableAuth,
    displayName: 'Base',
    required: true,
    refreshers: [],
    options: async ({ auth }): Promise<DropdownState<string>> => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your Airtable account first',
        };
      }

      try {
        const bases: AirtableBase[] = await fetchAllBases({
          token: auth.secret_text,
        });
        return {
          disabled: false,
          options: bases.map((base: AirtableBase) => {
            return { value: base.id, label: base.name };
          }),
        };
      } catch (e) {
        console.debug(e);
        return {
          disabled: true,
          options: [],
          placeholder: "Could not load. Check the token's scopes.",
        };
      }
    },
  }),

  workspaceId: Property.Dropdown<string,true,typeof airtableAuth>({
    auth: airtableAuth,
    displayName: 'Workspace',
    description:
      'Listed by ID because Airtable has no workspace name API.',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your Airtable account first',
        };
      }

      try {
        const bases = await fetchAllBases({
          token: auth.secret_text,
        });

        const workspacePromises = bases.map((base) =>
          fetchBase({ token: auth.secret_text, baseId: base.id })
        );
        const basesWithWorkspaces = await Promise.all(workspacePromises);

        const workspaces = basesWithWorkspaces.reduce((acc, base) => {
          if (base.workspaceId) {
            acc[base.workspaceId] = base.workspaceId;
          }
          return acc;
        }, {} as Record<string, string>);

        return {
          disabled: false,
          options: Object.entries(workspaces).map(([id, name]) => ({
            label: name,
            value: id,
          })),
        };
      } catch (e) {
        console.debug(e);
        return {
          disabled: true,
          options: [],
          placeholder: "Could not load. Check the token's scopes.",
        };
      }
    },
  }),

  tableId: Property.Dropdown<string,true,typeof airtableAuth>({
    auth: airtableAuth,
    displayName: 'Table',
    required: true,
    refreshers: ['base'],
    options: async ({ auth, base }): Promise<DropdownState<string>> => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your Airtable account first',
        };
      }
      if (!base) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Select a base first',
        };
      }

      try {
        const tables: AirtableTable[] = await fetchTableList({
          token: auth.secret_text,
          baseId: base as string,
        });

        return {
          disabled: false,
          options: tables.map((table) => ({
            value: table.id,
            label: table.name,
          })),
        };
      } catch (e) {
        console.debug(e);
        return {
          disabled: true,
          options: [],
          placeholder: "Could not load. Check the token's scopes.",
        };
      }
    },
  }),

  views: Property.Dropdown<string,false,typeof airtableAuth>({
    auth: airtableAuth,
    displayName: 'View',
    description: 'Only records in this view are used. Empty: the whole table.',
    required: false,
    refreshers: ['base', 'tableId'],
    options: async ({ auth, base, tableId }): Promise<DropdownState<string>> => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your Airtable account first',
        };
      }
      if (!base) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Select a base first',
        };
      }
      if (!tableId) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Select a table first',
        };
      }

      try {
        const views: AirtableView[] = await fetchViews({
          token: auth.secret_text,
          baseId: base as string,
          tableId: tableId as string,
        });

        return {
          disabled: false,
          options: views.map((view) => ({
            value: view.id,
            label: view.name,
          })),
        };
      } catch (e) {
        console.debug(e);
        return {
          disabled: true,
          options: [],
          placeholder: "Could not load. Check the token's scopes.",
        };
      }
    },
  }),

  recordId: Property.ShortText({
    displayName: 'Record ID',
    required: true,
    description:
      'Starts with rec. Copy it from the record URL or an earlier step.',
    placeholder: 'recXXXXXXXXXXXXXX',
  }),

  fields: Property.DynamicProperties({
    auth: airtableAuth,
    displayName: 'Fields',
    required: true,
    refreshers: ['base', 'tableId'],

    props: async ({ auth, base, tableId }) => {
      if (!auth) return {};
      if (!base) return {};
      if (!tableId) return {};

      const airtable: AirtableTable = await fetchTable({
        token: auth.secret_text,
        baseId: base as unknown as string,
        tableId: tableId as unknown as string,
      });
      const fields = airtable.fields.reduce((acc, field) => {
        if (!AirtableEnterpriseFields.includes(field.type)) {
          const params = {
            displayName: field.name,
            description: field.description,
            required: false,
            ...(field.type === 'date'
              ? { placeholder: 'March 5, 2024' }
              : {}),
            ...(field.type === 'dateTime'
              ? { placeholder: 'March 5, 2024 10:30' }
              : {}),
          };

          if (isNil(AirtableFieldMapping[field.type])) {
            acc[field.id] = Property.ShortText({
              ...params,
            });
          } else if (
            field.type === 'singleSelect' ||
            field.type === 'multipleSelects'
          ) {
            const options = field.options?.choices.map(
              (option: { id: string; name: string }) => ({
                value: option.id,
                label: option.name,
              })
            );

            acc[field.id] = AirtableFieldMapping[field.type]({
              ...params,
              options: {
                options: options ?? [],
              },
            });
          } else {
            acc[field.id] = AirtableFieldMapping[field.type](params);
          }
        }

        return acc;
      }, {} as DynamicPropsValue);

      return fields;
    },
  }),

  recordIdDropdown: Property.Dropdown<string,true,typeof airtableAuth>({
      auth: airtableAuth,
      displayName: 'Record',
      description:
        'Lists the first 500 records by their primary field.',
      required: true,
      refreshers: ['base', 'tableId'],
      options: async ({ auth, base, tableId }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Connect your Airtable account first',
          };
        }
        if (!base) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Select a base first',
          };
        }
        if (!tableId) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Select a table first',
          };
        }

        try {
          const table = await fetchTable({
            token: auth.secret_text,
            baseId: base as string,
            tableId: tableId as string,
          });
          const primaryField = table.fields.find(
            (f) => f.id === table.primaryFieldId
          );
          const primaryFieldName = primaryField?.name;

          const records = await listRecords({
            token: auth.secret_text,
            baseId: base as string,
            tableId: tableId as string,
          });

          const options = records.map((record) => {
            let label = record.id;
            if (primaryFieldName && record.fields[primaryFieldName]) {
              label = record.fields[primaryFieldName] as string;
            }
            return {
              label: label,
              value: record.id,
            };
          });

          return {
            disabled: false,
            options: options,
          };
        } catch (e) {
          console.debug(e);
          return {
            disabled: true,
            options: [],
            placeholder: "Could not load. Check the token's scopes.",
          };
        }
      },
  }),

  fieldNames: Property.Dropdown({
    auth: airtableAuth,
    displayName: 'Search Field',
    required: true,
    refreshers: ['base', 'tableId'],
    options: async ({ auth, base, tableId }): Promise<DropdownState<string>> => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your Airtable account first',
        };
      }
      if (!base) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Select a base first',
        };
      }
      if (!tableId) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Select a table first',
        };
      }

      try {
        const airtable: AirtableTable = await fetchTable({
          token: auth.secret_text,
          baseId: base as string,
          tableId: tableId as string,
        });
        return {
          disabled: false,
          options: airtable.fields.map((field: AirtableField) => ({
            label: field.name,
            value: field.name,
          })),
        };
      } catch (e) {
        console.debug(e);
        return {
          disabled: true,
          options: [],
          placeholder: "Could not load. Check the token's scopes.",
        };
      }
    },
  }),
  

  createNewFields: async (
    auth: string,
    base: string,
    tableId: string,
    fields: Record<string, unknown>,
    allowEmpty = false
  ) => {
    if (!auth) return fields;
    if (!base) return fields;
    if (!tableId) return fields;

    const newFields: Record<string, unknown> = {};

    const airtable: AirtableTable = await fetchTable({
      token: auth,
      baseId: base,
      tableId: tableId,
    });

    airtable.fields.forEach((field) => {
      if (!AirtableEnterpriseFields.includes(field.type)) {
        const key = field.id;

        if (!(key in fields)) {
          return;
        }
        if (field.type === 'multipleAttachments') {
          if (allowEmpty && (!fields[key] || (Array.isArray(fields[key]) && (fields[key] as any[]).length === 0))) {
            newFields[key] = [];
          } else if (fields[key] && !(Array.isArray(fields[key]) && (fields[key] as any[]).length === 0)) {
            newFields[key] = [
              {
                url: fields[key] as string,
              },
            ];
          }
        } else if (
          ['multipleRecordLinks', 'multipleSelects'].includes(field.type)
        ) {
          if (allowEmpty) {
            newFields[key] = Array.isArray(fields[key]) ? fields[key] : [];
          } else if (Array.isArray(fields[key]) && (fields[key] as any[]).length > 0) {
            newFields[key] = fields[key];
          }
        } else {
          if (allowEmpty) {
            newFields[key] = (fields[key] === '' || fields[key] === undefined) ? null : fields[key];
          } else if (fields[key] !== undefined && fields[key] !== '' && fields[key] !== null) {
            newFields[key] = fields[key];
          }
        }
      }
    });
    return newFields;
  },

  getTableSnapshot: async (params: Params) => {
    Airtable.configure({
      apiKey: params.personalToken,
    });
    const airtable = new Airtable();
    const currentTableSnapshot = (
      await airtable
        .base(params.baseId)
        .table(params.tableId)
        .select(params.limitToView ? { view: params.limitToView } : {})
        .all()
    )
      .map((r: any) => r._rawJson)
      .sort(
        (x: any, y: any) =>
          new Date(x.createdTime).getTime() - new Date(y.createdTime).getTime()
      );
    return currentTableSnapshot;
  },


  createRecord,
  findRecord,
  updateRecord,
  deleteRecord,
  getRecordById,
  fetchAllBases,
  fetchTableList,
  fetchTable,
  fetchViews,
  addCommentToRecord,
  createBase,
  createTable,
  listRecords,
  fetchBase,
};