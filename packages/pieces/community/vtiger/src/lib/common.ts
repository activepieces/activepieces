import {
  AuthenticationType,
  HttpHeaders,
  HttpMessageBody,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import {
  DropdownState,
  DynamicPropsValue,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import * as crypto from 'crypto-js';
import { Challenge, Instance } from './models';
import { vtigerAuth } from '..';

export const isBaseUrl = (urlString: string): boolean => {
  try {
    const url = new URL(urlString);
    return !url.pathname || url.pathname === '/';
  } catch (error) {
    // Handle invalid URLs here, e.g., return false or throw an error
    return false;
  }
};

export const md5 = (contents: string) => crypto.MD5(contents).toString();
export const calculateAuthKey = (
  challengeToken: string,
  accessKey: string
): string => crypto.MD5(challengeToken + accessKey).toString(crypto.enc.Hex);

export const instanceLogin = async (
  instance_url: string,
  username: string,
  password: string,
  debug = false
) => {
  const endpoint = `${instance_url}/webservice.php`;
  const challenge = await httpClient.sendRequest<{
    success: boolean;
    result: Challenge;
  }>({
    method: HttpMethod.GET,
    url: `${endpoint}?operation=getchallenge&username=${username}`,
  });

  const accessKey = calculateAuthKey(challenge.body.result.token, password);
  const response = await httpClient.sendRequest<{
    success: boolean;
    result: Instance;
  }>({
    method: HttpMethod.POST,
    url: `${endpoint}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: {
      operation: 'login',
      username,
      accessKey,
    },
  });

  if (debug) {
    console.debug('>>>>>>>>>>>> LOGIN', response.body, {
      method: HttpMethod.POST,
      url: `${endpoint}`,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: {
        operation: 'login',
        username,
        accessKey,
      },
    });
  }
  if (response.body.success) {
    return response.body.result;
  }

  return null;
};

export type Operation =
  | 'create'
  | 'retrieve'
  | 'delete'
  | 'update'
  | 'query'
  | 'listtypes';

export const Operations: Record<Operation, BodyParams> = {
  listtypes: {
    method: HttpMethod.GET,
  },
  create: {
    method: HttpMethod.POST,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  },
  retrieve: {
    method: HttpMethod.GET,
  },
  delete: {
    method: HttpMethod.POST,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  },
  update: {
    method: HttpMethod.POST,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  },
  query: {
    method: HttpMethod.GET,
  },
};

export const prepareHttpRequest = (
  instanceUrl: string,
  sessionName: string,
  operation: Operation,
  record: Record<string, string>
) => {
  const data: Record<string, string> = {
    operation,
    sessionName,
    ...record,
  };
  if ('element' in record) data['element'] = JSON.stringify(record['element']);

  const httpRequest: HttpRequest<HttpMessageBody> = {
    url: `${instanceUrl}/webservice.php`,
    method: Operations[operation].method,
    headers: Operations[operation].headers,
  };

  if (Operations[operation].method === HttpMethod.GET) {
    httpRequest['queryParams'] = data;
  } else if (Operations[operation].method === HttpMethod.POST) {
    httpRequest['body'] = data;
  }

  return httpRequest;
};

interface BodyParams {
  method: HttpMethod;
  headers?: HttpHeaders;
}

export const Modules: Record<string, (record: Record<string, string>) => Promise<string>> = {
  Contacts: async (record) => `${record['email']}`, // firstname,lastname
  Documents: async (record) => `${record['notes_title']}`, // title
  Faq: async (record) => `${record['faq_no']}`, // question
  // HelpDesk: async (record) => `${record['ticket_no']}`, // this module not exist
  Invoice: async (record) => `${record['invoice_no']}`, // subject
  Leads: async (record) => `${record['lead_no']}: ${record['firstname']} ${record['lastname']}`, // firstname,lastname
  LineItem: async (record) => `${record['productid']}`, // no label field
  ProductTaxes: async (record) => `#${record['taxid']} pid: ${record['productid']}`, // no label field
  // ProjectTask: async (record) => `${record['projecttaskname']}`,  // this module not exist
  SalesOrder: async (record) => `${record['salesorder_no']}`, // subject
  Tax: async (record) => `${record['taxname']}`, // taxlabel
  Users: async (record) => `${record['user_name']}`, // first_name,last_name
};

export async function refreshModules(auth: VTigerAuthValue){
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${(auth as VTigerAuthValue)['instance_url']}/restapi/v1/vtiger/default/listtypes?fieldTypeList=null`,
    authentication: {
      type: AuthenticationType.BASIC,
      username: auth.username,
      password: auth.password,
    },
  });

  if(response.body.success !== true){
    throw new Error('Failed to retrieve module types');
  }

  const types = response.body.result.types;
  for (let i = 0; i < types.length; i++) {
    const element = types[i];

    let labelFields = '';
    let isModuleLabelUnknown = false;
    Modules[element] ??= async (record) => {
      if(labelFields !== '') return labelFields;
      if(isModuleLabelUnknown) return '';

      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${(auth as VTigerAuthValue)['instance_url']}/restapi/v1/vtiger/default/describe?elementType=${element}`,
        authentication: {
			    type: AuthenticationType.BASIC,
          username: auth.username,
          password: auth.password,
        },
      });

      if (!response.body.success) return '';

      const result = response.body.result;
      const lf = result.labelFields;
      if (Array.isArray(lf)) {
        labelFields = (lf[0] ?? '') as string;
      } else if (typeof lf === 'string') {
        labelFields = lf.includes(',') ? lf.split(',')[0] : lf;
      } else {
        labelFields = '';
      }

      if(labelFields === '') {
        if(!result.fields?.length){
          isModuleLabelUnknown = true;
          return '';
        }

        labelFields = result.fields[0].name;
      }

      return record[labelFields];
    };
  }
}

export const elementTypeProperty = Property.Dropdown({
  displayName: 'Module Type',
  description: 'The module / element type',
  required: true,
  refreshers: [],
  options: async (props: any) => {
    const { auth } = props;
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please setup authentication to continue',
      };
    }

    await refreshModules(auth);

    const modules = Object.keys(Modules).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    return {
      disabled: false,
      options: modules.map((module) => ({
        label: module,
        value: module,
      }))
    };
  }
});

export interface Field {
  name: string;
  dblabel: string;
  label: string;
  default: string;
  mandatory: boolean;
  type: {
    name: string;
    length?: string;
    refersTo?: string[];
    picklistValues?: {
      label: string;
      value: string;
    }[];
  };
}

export type VTigerAuthValue = PiecePropValueSchema<typeof vtigerAuth>;

export const recordIdProperty = () =>
  Property.DynamicProperties({
    displayName: 'Record Fields',
    description: 'Add new fields to be created in the new record',
    required: true,
    refreshers: ['elementType'],
    props: async ({ auth, elementType }) => {
      if (!auth || !elementType) {
        return {};
      }

      const instance = await instanceLogin(
        auth['instance_url'],
        auth['username'],
        auth['password']
      );
      if (!instance) return {};

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

      if (!response.body.success) return {};

      const fields: DynamicPropsValue = {};
      const _type: string = elementType as unknown as string;
      const _module: CallableFunction = Modules[_type];

      fields['id'] = Property.StaticDropdown<string>({
        displayName: 'Id',
        description: "The record's id",
        required: true,
        options: {
          options: response.body.result.map((r) => ({
            label: _module?.(r) || r['id'],
            value: r['id'],
          })),
        },
      });

      return fields;
    },
  });

export const FieldMapping = {
  autogenerated: Property.ShortText,
  string: Property.ShortText,
  text: Property.ShortText,
  double: Property.Number,
  integer: Property.Number,
  mediumtext: Property.LongText,
  phone: Property.LongText,
  url: Property.LongText,
  email: Property.LongText,
  picklist: Property.StaticDropdown,
  reference: Property.StaticDropdown,
  currency: Property.Number,
  boolean: Property.Checkbox,
  owner: Property.StaticDropdown,
  date: Property.DateTime,
  datetime: Property.DateTime,
  file: Property.File,
  time: Property.DateTime,
};

export async function getRecordReference(
  auth: PiecePropValueSchema<typeof vtigerAuth>,
  modules: string[]
): Promise<DropdownState<string>> {
  const module = modules[0]; //Limit to the first reference for now
  const vtigerInstance = await instanceLogin(
    auth['instance_url'],
    auth['username'],
    auth['password']
  );
  if (vtigerInstance === null)
    return {
      disabled: true,
      options: [],
    };

  const httpRequest = prepareHttpRequest(
    auth['instance_url'],
    vtigerInstance.sessionId ?? vtigerInstance.sessionName,
    'query' as Operation,
    { query: `SELECT * FROM ${module};` }
  );

  const response = await httpClient.sendRequest<{
    success: boolean;
    result: Record<string, any>[];
  }>(httpRequest);

  if (response.body.success) {
    return {
      disabled: false,
      options: await Promise.all(response.body.result.map(async (record) => {
        return {
          label: await Modules[module]?.(record) || record['id'],
          value: record['id'] as string,
        };
      })),
    };
  }

  return {
    disabled: true,
    options: [],
  };
}

export const recordProperty = (create = true) =>
  Property.DynamicProperties({
    displayName: 'Record Fields',
    description: 'Add new fields to be created in the new record',
    required: true,
    refreshers: create ? ['elementType'] : ['id', 'elementType'],
    props: async ({ auth, id, elementType }) => {
      if (!auth || !elementType) {
        return {};
      }

      let defaultValue: Record<string, unknown>;

      if (create) {
        defaultValue = {};
      } else {
        if (id && 'id' in id) {
          const retrieve_response = await httpClient.sendRequest<
            Record<string, unknown>
          >({
            method: HttpMethod.GET,
            url: `${(auth as VTigerAuthValue)['instance_url']}/restapi/v1/vtiger/default/retrieve`,
            authentication: {
              type: AuthenticationType.BASIC,
              username: auth['username'],
              password: auth['password'],
            },
            queryParams: {
              elementType: elementType as unknown as string,
              id: id['id'] as unknown as string,
            },
          });
          defaultValue = retrieve_response.body;
        } else {
          defaultValue = {};
        }
      }

      return generateElementFields(
        auth as VTigerAuthValue,
        elementType as unknown as string,
        defaultValue
      );
    },
  });

export const queryRecords = async (
  auth: VTigerAuthValue,
  elementType: string,
  page = 0,
  limit = 100
) => {
  const instance = await instanceLogin(
    auth['instance_url'],
    auth['username'],
    auth['password']
  );
  if (!instance) return [];

  const response = await httpClient.sendRequest<{
    success: boolean;
    result: Record<string, unknown>[];
  }>({
    method: HttpMethod.GET,
    url: `${(auth as VTigerAuthValue)['instance_url']}/webservice.php`,
    queryParams: {
      sessionName: instance.sessionId ?? instance.sessionName,
      operation: 'query',
      elementType: elementType as unknown as string,
      query: `SELECT * FROM ${elementType} LIMIT ${page}, ${limit};`,
    },
  });

  if (response.body.success) {
    return response.body.result;
  }

  return [];
};

export const countRecords = async (
  auth: VTigerAuthValue,
  elementType: string
) => {
  const instance = await instanceLogin(
    auth['instance_url'],
    auth['username'],
    auth['password']
  );
  if (!instance) return 0;

  const response = await httpClient.sendRequest<{
    success: boolean;
    result: { count: string }[];
  }>({
    method: HttpMethod.GET,
    url: `${(auth as VTigerAuthValue)['instance_url']}/webservice.php`,
    queryParams: {
      sessionName: instance.sessionId ?? instance.sessionName,
      operation: 'query',
      elementType: elementType as unknown as string,
      query: `SELECT count(*) FROM ${elementType};`,
    },
  });

  if (response.body.success) {
    return Number.parseInt(response.body.result[0].count);
  }

  return 0;
};

export const generateElementFields = async (
  auth: VTigerAuthValue,
  elementType: string,
  defaultValue: Record<string, unknown>,
  skipMandatory = false
): Promise<DynamicPropsValue> => {
  const describe_response = await httpClient.sendRequest<{
    success: boolean;
    result: { fields: Field[] };
  }>({
    method: HttpMethod.GET,
    url: `${auth['instance_url']}/restapi/v1/vtiger/default/describe`,
    authentication: {
      type: AuthenticationType.BASIC,
      username: auth.username,
      password: auth.password,
    },
    queryParams: {
      elementType: elementType,
    },
  });

  const fields: DynamicPropsValue = {};

  if (describe_response.body.success) {
    let limit = 30; // Limit to show 30 input property, more than this will cause frontend unresponsive

    const generateField = async (field: Field) => {
      const params = {
        displayName: field.label,
        description: `Field ${field.name} of object type ${elementType}`,
        required: !skipMandatory ? field.mandatory : false,
      };

      if (
        ['string', 'text', 'mediumtext', 'phone', 'url', 'email'].includes(
          field.type.name
        )
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
      } else if (['picklist', 'reference', 'owner'].includes(field.type.name)) {
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
      } else if (['double', 'integer', 'currency'].includes(field.type.name)) {
        fields[field.name] = Property.Number({
          ...params,
          defaultValue: defaultValue?.[field.name] as number,
        });
      } else if (['boolean'].includes(field.type.name)) {
        fields[field.name] = Property.Checkbox({
          displayName: field.label,
          description: `The fields to fill in the object type ${elementType}`,
          required: !skipMandatory ? field.mandatory : false,
          defaultValue: defaultValue?.[field.name] ? true : false,
        });
      } else if (['date', 'datetime', 'time'].includes(field.type.name)) {
        fields[field.name] = Property.DateTime({
          displayName: field.label,
          description: `The fields to fill in the object type ${elementType}`,
          defaultValue: defaultValue?.[field.name] as string,
          required: !skipMandatory ? field.mandatory : false,
        });
      } else if(params.required) {
        // Add the mandatory field for unknown input type, but with text input
        fields[field.name] = Property.ShortText({
          ...params,
          defaultValue: defaultValue?.[field.name] as string,
        });
      }
    };

    const skipFields = [
      'id',
      'modifiedtime',
      'createdtime',
      'modifiedby',
      'created_user_id',
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
  else throw new Error("Failed to get module description");

  return fields;
};
