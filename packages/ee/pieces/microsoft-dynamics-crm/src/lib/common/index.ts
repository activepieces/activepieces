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
import { dynamicsCRMAuth } from '../../';
import { DynamicsCRMClient } from './client';
import { EntityAttributeType, EntityDetails } from './constants';

export function makeClient(auth: PiecePropValueSchema<typeof dynamicsCRMAuth>) {
  const client = new DynamicsCRMClient(
    auth.props?.['hostUrl'],
    auth.access_token
  );
  return client;
}

export const DynamicsCRMCommon = {
  entityType: (description: string) =>
    Property.StaticDropdown({
      displayName: 'Entity Type',
      description,
      required: true,
      options: {
        disabled: false,
        options: Object.keys(EntityDetails).map((key) => {
          return {
            label: EntityDetails[key].displayName,
            value: EntityDetails[key].value,
          };
        }),
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

      const entityUrlPath = EntityDetails[entityType as string].urlPath;
      const entityPrimaryKey = EntityDetails[entityType as string].primaryKey;
      const entityprimaryNameAttribute =
        EntityDetails[entityType as string].primaryNameAttribute;

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
        url: `${authValue.props?.['hostUrl']}/api/data/v9.2/${entityUrlPath}`,
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

        const res = await client.fetchEntityAttributes(
          entityType as unknown as string
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
                  entityType as unknown as string,
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
