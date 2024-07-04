import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import {
  DynamicPropsValue,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import { dynamicsCRMAuth, getBaseUrl } from '../../';
import { DynamicsCRMClient } from './client';
import { EntityAttributeType } from './constants';

export function makeClient(auth: PiecePropValueSchema<typeof dynamicsCRMAuth>) {
  const client = new DynamicsCRMClient(
    auth.props?.['hostUrl'],
    auth.access_token,
    auth.props?.['proxyUrl']
  );
  return client;
}

export const DynamicsCRMCommon = {
  entityType: (description: string) =>
    Property.Dropdown({
      displayName: 'Entity Type',
      refreshers: [],
      description,
      required: true,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: '',
          };
        }

        const client = makeClient(
          auth as PiecePropValueSchema<typeof dynamicsCRMAuth>
        );

        const res = await client.fetchEntityTypes();

        return {
          disabled: false,
          options: res.value.map((val) => {
            return {
              label: val.EntitySetName,
              value: val.EntitySetName,
            };
          }),
        };
      },
    }),
  recordId: Property.Dropdown({
    displayName: 'Record ID',
    refreshers: ['entityType'],
    required: true,
    options: async ({ auth, entityType }) => {
      if (!auth || !entityType) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select entity type first.',
        };
      }

      const client = makeClient(
        auth as PiecePropValueSchema<typeof dynamicsCRMAuth>
      );

      const res = await client.fetchEntityTypeAttributes(entityType as string);

      if (!res.value[0]) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select entity type first.',
        };
      }

      const entityUrlPath = entityType as string;
      const entityPrimaryKey = res.value[0].PrimaryIdAttribute;
      const entityprimaryNameAttribute = res.value[0].PrimaryNameAttribute;

      const authValue = auth as PiecePropValueSchema<typeof dynamicsCRMAuth>;

      type Response = {
        '@odata.context': string;
        value: Array<{
          [K in
            | typeof entityprimaryNameAttribute
            | typeof entityPrimaryKey]: string;
        }>;
      };

      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${getBaseUrl(
          authValue.props?.['hostUrl'],
          authValue.props?.['proxyUrl']
        )}/api/data/v9.2/${entityUrlPath}`,
        queryParams: {
          $select: entityprimaryNameAttribute,
        },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: authValue.access_token,
        },
        headers: {
          Accept: 'application/json',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0',
          'Content-Type': 'application/json',
        },
      };

      const { body } = await httpClient.sendRequest<Response>(request);

      return {
        disabled: false,
        options: body.value.map((val) => {
          return {
            label: val[entityprimaryNameAttribute] ?? val[entityPrimaryKey],
            value: val[entityPrimaryKey],
          };
        }),
      };
    },
  }),
  entityFields: (isCreate = true) =>
    Property.DynamicProperties({
      displayName: 'Entity Fields',
      refreshers: ['auth', 'entityType'],
      required: true,
      props: async ({ auth, entityType }) => {
        if (!auth) return {};
        if (!entityType) return {};

        const fields: DynamicPropsValue = {};

        const client = makeClient(
          auth as PiecePropValueSchema<typeof dynamicsCRMAuth>
        );

        const typeRes = await client.fetchEntityTypeAttributes(
          entityType as unknown as string
        );

        if (!typeRes.value[0]) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please select entity type first.',
          };
        }

        const res = await client.fetchEntityAttributes(
          typeRes.value[0].LogicalName
        );

        for (const field of res.value) {
          if (
            field.IsValidForCreate &&
            ![
              EntityAttributeType.ENTITY_NAME,
              EntityAttributeType.LOOKUP,
              EntityAttributeType.MEMO,
              EntityAttributeType.MONEY,
              EntityAttributeType.OWNER,
              EntityAttributeType.VIRTUAL,
              EntityAttributeType.UNIQUE_IDENTIFIER,
            ].includes(field.AttributeType)
          ) {
            const params = {
              displayName:
                field.DisplayName?.UserLocalizedLabel?.Label ??
                field.LogicalName,
              description: field.Description?.UserLocalizedLabel?.Label ?? '',
              required: field.IsPrimaryName && isCreate,
            };
            switch (field.AttributeType) {
              case EntityAttributeType.BIGINT:
              case EntityAttributeType.DECIMAL:
              case EntityAttributeType.DOUBLE:
              case EntityAttributeType.INTEGER:
                fields[field.LogicalName] = Property.Number(params);
                break;
              case EntityAttributeType.DATETIME:
                fields[field.LogicalName] = Property.DateTime(params);
                break;
              case EntityAttributeType.BOOLEAN:
                fields[field.LogicalName] = Property.Checkbox(params);
                break;
              case EntityAttributeType.STRING:
                fields[field.LogicalName] = Property.ShortText(params);
                break;
              case EntityAttributeType.PICKLIST:
              case EntityAttributeType.STATE:
              case EntityAttributeType.STATUS: {
                const options = await client.fetchOptionFieldValues(
                  typeRes.value[0].LogicalName,
                  field.LogicalName,
                  field.AttributeType
                );
                fields[field.LogicalName] = Property.StaticDropdown({
                  ...params,
                  options: {
                    disabled: false,
                    options: options,
                  },
                });
                break;
              }
              default:
                break;
            }
          }
        }
        return fields;
      },
    }),
};
