/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from 'dotenv';
dotenv.config({
  path: './assemblyai.env',
});
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import OpenAPIParser from '@readme/openapi-parser';
import { mergician } from 'mergician';
import { titleCase } from 'title-case';

const generatedPath = './src/lib/generated/';

type Generators = {
  props?: (schemas: any) => any;
};
const generateMap: Record<string, Generators> = {
  transcribe: {
    props: (schemas) => schemas.TranscriptParams,
  },
  'list-transcript': {
    props: (schemas) => schemas.ListTranscriptParams,
  },
  'lemur-task': {
    props: (schemas) => schemas.LemurTaskParams,
  },
};

const merge = mergician({ appendArrays: true, dedupArrays: true });
(async function () {
  const specLocation = process.env.OPENAPI_SPEC_LOCATION;
  if (!specLocation)
    throw new Error('OPENAPI_SPEC_LOCATION env variable is required');

  let spec: any = merge(
    await OpenAPIParser.parse(specLocation),
    await OpenAPIParser.parse('./scripts/openapi.overrides.yml', {
      validate: {
        schema: false,
        spec: false,
      },
    })
  );

  spec = await OpenAPIParser.dereference(spec);

  Object.entries(generateMap).forEach(([paramsName, { props }]) => {
    const parametersPath = join(generatedPath, paramsName, 'props.ts');
    if (props) {
      let propsJson = createPropsFromSchema(props(spec.components.schemas));
      let propsTs = createTs(propsJson);

      const dir = dirname(parametersPath);
      mkdirSync(dir, { recursive: true });
      writeFileSync(parametersPath, propsTs, 'utf-8');
    } else if (existsSync(parametersPath)) {
      unlinkSync(parametersPath);
    }
  });
})();

function createPropsFromSchema(schema: any): Record<string, any> {
  if (!schema) return {};
  schema = structuredClone(schema);
  if (schema.allOf) {
    const obj = {};
    (schema.allOf as any[]).forEach((schema) =>
      Object.assign(obj, createPropsFromSchema(schema))
    );
    return obj;
  }

  if (!schema.properties) return {};

  const properties: Record<string, unknown> = {};
  const requiredProperties = schema.required ?? [];
  for (let [key, value] of Object.entries(schema.properties) as [
    key: string,
    value: any
  ]) {
    if (value['x-ap-ignore']) {
      continue;
    }

    let nullable = false;
    let label: string;
    if (value['x-label']) {
      label = titleCase(value['x-label']);
    } else {
      label = titleCase(key);
      console.warn(`No x-label found for property ${key}`);
    }
    // grab the value of oneOf with null
    if (value.oneOf) {
      if (value.oneOf.findIndex((item: any) => item.type === 'null') > -1) {
        nullable = true;
      }

      const options = value.oneOf.filter((item: any) => item.type !== 'null');
      // take first one and hope for the best
      value.oneOf = undefined;
      const option = {
        type: options[0].type,
        enum: options[0].enum,
        format: options[0].format,
        items: options[0].items,
        'x-aai-enum': options[0]['x-aai-enum'],
        anyOf: options[0].anyOf,
      };
      value = { ...value, ...option };
      if (options[0].properties) {
        value.properties = { ...value.properties, ...options[0].properties };
      }
      if (options[0].required) {
        value.required = (value.required || []).concat(options[0].required);
      }
    }
    if (value.anyOf) {
      const enumAnyOfIndex = value.anyOf.findIndex((item: any) => item.enum);
      // if any string or an enum, use the enum
      if (
        value.anyOf.findIndex((item: any) => item.type === 'string') > -1 &&
        enumAnyOfIndex > -1
      ) {
        value.type = value.anyOf[enumAnyOfIndex].type;
        value.enum = value.anyOf[enumAnyOfIndex].enum;
        if ('x-aai-enum' in value.anyOf[enumAnyOfIndex]) {
          value['x-aai-enum'] = value.anyOf[enumAnyOfIndex]['x-aai-enum'];
        }
        value.anyOf = undefined;
      } else {
        throw new Error(`Unsupported AnyOf found for ${key}`);
      }
    }
    if (Array.isArray(value.type)) {
      if (value.type.indexOf('null') > -1) {
        nullable = true;
      }
      const types = value.type.filter((type: string) => type !== 'null');
      if (types.length === 1) {
        value.type = types[0];
      } else {
        throw new Error(`Multiple types found for ${key}`);
      }
    }

    const required = requiredProperties.indexOf(key) > -1 && !nullable;

    // handleArray
    if (value.type === 'array' && value.items.type === 'object') {
      properties[key] = {
        displayName: label,
        description: value.description,
        type: 'Array',
        required,
        properties: { ...createPropsFromSchema(value.items) },
      };
    } else if (
      value.items &&
      value.items.type === 'string' &&
      value.items.enum
    ) {
      properties[key] = {
        ...createField(key, label, value.items, required),
        displayName: label,
        description: value.description,
        type: 'StaticMultiSelectDropdown',
        required,
      };
    } else {
      // default field
      properties[key] = createField(key, label, value, required);
    }
  }
  return properties;
}

function createField(
  key: string,
  label: string,
  value: any,
  required: boolean
) {
  const field: any = {
    displayName: label,
    type: mapType(value),
    required,
    description: value.description,
  };

  if (value.type === 'boolean' && 'default' in value) {
    field.defaultValue = value.default;
  }

  if (value.enum) {
    field.type = 'StaticDropdown';
    field.options = {
      options: (value.enum as string[]).map((item) => {
        const option = { label: titleCase(item), value: item };
        if (
          value['x-aai-enum'] &&
          value['x-aai-enum'][item] &&
          value['x-aai-enum'][item]['label']
        ) {
          option.label = titleCase(value['x-aai-enum'][item]['label']);
          return option;
        } else {
          console.warn(`No x-aai-enum value found for property ${key} ${item}`);
        }
        return option;
      }),
    };
  }
  return field;
}

const typeMap: Record<string, string> = {
  date: 'DateTime',
  'date-time': 'DateTime',
  url: 'ShortText',
  string: 'ShortText',
  uuid: 'ShortText',
  object: 'Object',
  number: 'Number',
  integer: 'Number',
  float: 'Number',
  double: 'Number',
  boolean: 'Checkbox',
  array: 'Array',
  json: 'Json',
};

function mapType(schema: any) {
  if (schema['x-ap-type']) {
    return schema['x-ap-type'];
  }
  if (schema.format && schema.format in typeMap) {
    return typeMap[schema.format];
  }
  if (schema.type in typeMap) {
    return typeMap[schema.type];
  }
  throw new Error(`Unsupported type found ${schema.type}`);
}
function createTs(
  propsJson: Record<string, { type: string } & object>
): string {
  let result = `import { Property } from "@activepieces/pieces-framework";
export const props = `;
  result += createTsProps(propsJson);
  result += ';\n';
  return result;
}
function createTsProps(
  propsJson: Record<string, { type: string } & object>
): string {
  let result = '{\n';
  for (const key in propsJson) {
    const { type, ...prop } = propsJson[key];
    let innerProps: null | string = null;
    if ('properties' in prop) {
      innerProps = createTsProps(
        prop['properties'] as Record<string, { type: string } & object>
      );
      prop.properties = '[REPLACE_WITH_PROPS]';
    }
    result +=
      `  ${key}: Property.${type}(\n` +
      JSON.stringify(prop, null, '  ') +
      '),\n';
    if (innerProps) {
      result = result.replace('"[REPLACE_WITH_PROPS]"', innerProps);
    }
  }
  result += '\n}';
  return result;
}
