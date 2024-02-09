import {
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
      'Content-Type': 'multipart/form-data',
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

export const Modules: Record<string, CallableFunction> = {
  Accounts: (record: Record<string, string>) => `${record['accountname']}`,
  Assets: (record: Record<string, string>) => `${record['assetname']}`,
  CompanyDetails: (record: Record<string, string>) =>
    `${record['organizationname']}`,
  Contacts: (record: Record<string, string>) => `${record['email']}`,
  Currency: (record: Record<string, string>) => `${record['currency_name']}`,
  DocumentFolders: (record: Record<string, string>) =>
    `${record['foldername']}`,
  Documents: (record: Record<string, string>) => `${record['notes_title']}`,
  Emails: (record: Record<string, string>) => `${record['subject']}`,
  Events: (record: Record<string, string>) => `${record['subject']}`,
  Faq: (record: Record<string, string>) => `${record['faq_no']}`,
  Groups: (record: Record<string, string>) => `${record['groupname']}`,
  HelpDesk: (record: Record<string, string>) => `${record['ticket_no']}`,
  Invoice: (record: Record<string, string>) => `${record['invoice_no']}`,
  Leads: (record: Record<string, string>) =>
    `${record['lead_no']}: ${record['firstname']} ${record['lastname']}`,
  LineItem: (record: Record<string, string>) => `${record['productid']}`,
  ModComments: (record: Record<string, string>) =>
    `${record['commentcontent']}`,
  Potentials: (record: Record<string, string>) => `${record['potentialname']}`,
  PriceBooks: (record: Record<string, string>) => `${record['bookname']}`,
  Products: (record: Record<string, string>) => `${record['productname']}`,
  ProductTaxes: (record: Record<string, string>) =>
    `#${record['taxid']} pid: ${record['productid']}`,
  Project: (record: Record<string, string>) => `${record['projectname']}`,
  ProjectMilestone: (record: Record<string, string>) =>
    `${record['projectmilestonename']}`,
  ProjectTask: (record: Record<string, string>) =>
    `${record['projecttaskname']}`,
  PurchaseOrder: (record: Record<string, string>) => `${record['subject']}`,
  Quotes: (record: Record<string, string>) => `${record['subject']}`,
  SalesOrder: (record: Record<string, string>) => `${record['salesorder_no']}`,
  ServiceContracts: (record: Record<string, string>) => `${record['subject']}`,
  Services: (record: Record<string, string>) => `${record['servicename']}`,
  SLA: (record: Record<string, string>) => `${record['policy_name']}`,
  Tax: (record: Record<string, string>) => `${record['taxname']}`,
  Users: (record: Record<string, string>) => `${record['user_name']}`,
  Vendors: (record: Record<string, string>) => `${record['vendorname']}`,
};

export const elementTypeProperty = Property.StaticDropdown<string>({
  displayName: 'Module Type',
  description: 'The module / element type',
  required: true,
  options: {
    options: [
      { label: 'Accounts', value: 'Accounts' },
      { label: 'Assets', value: 'Assets' },
      { label: 'CompanyDetails', value: 'CompanyDetails' },
      { label: 'Contacts', value: 'Contacts' },
      { label: 'Currency', value: 'Currency' },
      { label: 'DocumentFolders', value: 'DocumentFolders' },
      { label: 'Documents', value: 'Documents' },
      { label: 'Emails', value: 'Emails' },
      { label: 'Events', value: 'Events' },
      { label: 'Faq', value: 'Faq' },
      { label: 'Groups', value: 'Groups' },
      { label: 'HelpDesk', value: 'HelpDesk' },
      { label: 'Invoice', value: 'Invoice' },
      { label: 'Leads', value: 'Leads' },
      { label: 'LineItem', value: 'LineItem' },
      { label: 'ModComments', value: 'ModComments' },
      { label: 'Potentials', value: 'Potentials' },
      { label: 'PriceBooks', value: 'PriceBooks' },
      { label: 'Products', value: 'Products' },
      { label: 'ProductTaxes', value: 'ProductTaxes' },
      { label: 'Project', value: 'Project' },
      { label: 'ProjectMilestone', value: 'ProjectMilestone' },
      { label: 'ProjectTask', value: 'ProjectTask' },
      { label: 'PurchaseOrder', value: 'PurchaseOrder' },
      { label: 'Quotes', value: 'Quotes' },
      { label: 'SalesOrder', value: 'SalesOrder' },
      { label: 'ServiceContracts', value: 'ServiceContracts' },
      { label: 'Services', value: 'Services' },
      { label: 'SLA', value: 'SLA' },
      { label: 'Tax', value: 'Tax' },
      { label: 'Users', value: 'Users' },
      { label: 'Vendors', value: 'Vendors' },
    ],
  },
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
            label: _module(r),
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
    result: Record<string, unknown>[];
  }>(httpRequest);

  if (response.body.success) {
    return {
      disabled: false,
      options: response.body.result.map((record) => {
        return {
          label: Modules[module](record),
          value: record['id'] as string,
        };
      }),
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

      if (create) {
        defaultValue = {};
      } else {
        if (id && 'id' in id) {
          const retrieve_response = await httpClient.sendRequest<
            Record<string, unknown>
          >({
            method: HttpMethod.GET,
            url: `${auth['instance_url']}/webservice.php`,
            queryParams: {
              operation: 'retrieve',
              sessionName: instance.sessionId ?? instance.sessionName,
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
  const instance = await instanceLogin(
    auth['instance_url'],
    auth['username'],
    auth['password']
  );
  if (!instance) return {};

  const describe_response = await httpClient.sendRequest<{
    success: boolean;
    result: { fields: Field[] };
  }>({
    method: HttpMethod.GET,
    url: `${auth['instance_url']}/webservice.php`,
    queryParams: {
      sessionName: instance.sessionId ?? instance.sessionName,
      operation: 'describe',
      elementType: elementType,
    },
  });

  const fields: DynamicPropsValue = {};

  if (describe_response.body.success) {
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
          defaultValue: defaultValue?.[field.name] as boolean,
        });
      } else if (['date', 'datetime', 'time'].includes(field.type.name)) {
        fields[field.name] = Property.DateTime({
          displayName: field.label,
          description: `The fields to fill in the object type ${elementType}`,
          defaultValue: defaultValue?.[field.name] as string,
          required: !skipMandatory ? field.mandatory : false,
        });
      }
    };

    for (const field of describe_response.body.result.fields) {
      if (
        [
          'id',
          'modifiedtime',
          'createdtime',
          'modifiedby',
          'created_user_id',
        ].includes(field.name)
      ) {
        continue;
      }

      await generateField(field);
    }
  }

  return fields;
};
