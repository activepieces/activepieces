import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { OutsetaClient } from './client';

export function customPropertiesProp(entityType: CustomPropertyEntity) {
  return Property.DynamicProperties({
    displayName: 'Custom Properties',
    description:
      `Custom properties defined on ${entityType} in your Outseta workspace. The widget for each field is automatically inferred from the property's ControlType (text, date, single-select, multi-select).`,
    required: false,
    refreshers: [],
    props: async ({ auth }) => {
      const a = auth as AuthShape | undefined;
      if (!a?.props?.domain) return {};
      const client = new OutsetaClient({
        domain: a.props.domain,
        apiKey: a.props.apiKey,
        apiSecret: a.props.apiSecret,
      });

      let res: { items?: Definition[]; Items?: Definition[] } | null;
      try {
        res = await client.get<{ items?: Definition[]; Items?: Definition[] }>(
          `/api/v1/attributes/${entityType}/definitions?limit=100`
        );
      } catch {
        return {};
      }
      const definitions: Definition[] = res?.items ?? res?.Items ?? [];

      const props: DynamicPropsValue = {};
      for (const def of definitions) {
        if (def.Hidden) continue;
        const sysName = def.SystemName;
        const label = def.Label ?? sysName;
        const description = parseControlParams(def.ControlParams).HintText;
        const params = parseControlParams(def.ControlParams);
        const options = (params.Options ?? []).map((o: string) => ({ label: o, value: o }));

        switch (def.ControlType) {
          case 'Date':
            props[sysName] = Property.DateTime({ displayName: label, description, required: false });
            break;
          case 'Select':
            props[sysName] = Property.StaticDropdown({
              displayName: label,
              description,
              required: false,
              options: { disabled: false, options },
            });
            break;
          case 'CheckboxList':
            props[sysName] = Property.StaticMultiSelectDropdown({
              displayName: label,
              description,
              required: false,
              options: { disabled: false, options },
            });
            break;
          default:
            props[sysName] = Property.ShortText({ displayName: label, description, required: false });
        }
      }
      return props;
    },
  });
}

export function mergeCustomProperties<T extends Record<string, unknown>>(
  entity: T,
  customProps: Record<string, unknown> | undefined | null
): T {
  if (!customProps) return entity;
  const target = entity as Record<string, unknown>;
  for (const [key, value] of Object.entries(customProps)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      // CheckboxList values are stored by Outseta as JSON-stringified arrays.
      target[key] = JSON.stringify(value);
    } else {
      target[key] = value;
    }
  }
  return entity;
}

function parseControlParams(raw: string | null | undefined): ControlParams {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ControlParams;
  } catch {
    return {};
  }
}

type AuthShape = { props: { domain: string; apiKey: string; apiSecret: string } };

type Definition = {
  SystemName: string;
  Label?: string;
  ControlType: 'Text' | 'Date' | 'Select' | 'CheckboxList' | string;
  ControlParams?: string | null;
  Hidden?: boolean;
};

type ControlParams = {
  HintText?: string;
  Options?: string[];
  Pattern?: string;
};

export type CustomPropertyEntity = 'Account' | 'Person' | 'Deal';
