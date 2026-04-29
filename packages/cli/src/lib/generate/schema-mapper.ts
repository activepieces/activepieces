import { MappedProperty, OpenAPISchema, EnumOption } from './types';

export const schemaMapper = { mapParam, mapSchema };

function mapParam({
  name,
  schema,
  required,
  description,
}: {
  name: string;
  schema: OpenAPISchema | undefined;
  required: boolean;
  description: string;
}): MappedProperty {
  return mapSchema({ schema: schema ?? {}, required, displayName: humanize(name), description });
}

function mapSchema({
  schema,
  required,
  displayName,
  description,
}: {
  schema: OpenAPISchema;
  required: boolean;
  displayName: string;
  description: string;
}): MappedProperty {
  const baseDescription = schema.description ?? description;
  const defaultValue = schema.default;

  if (schema.enum && schema.enum.length > 0) {
    const enumOptions: EnumOption[] = schema.enum.map(v => ({
      label: String(v),
      value: v as string | number,
    }));
    return {
      propertyKind: 'STATIC_DROPDOWN',
      displayName,
      description: baseDescription,
      required,
      defaultValue,
      enumOptions,
    };
  }

  if (schema.allOf || schema.anyOf || schema.oneOf) {
    return { propertyKind: 'JSON', displayName, description: baseDescription, required, defaultValue };
  }

  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;

  switch (type) {
    case 'integer':
    case 'number':
      return { propertyKind: 'NUMBER', displayName, description: baseDescription, required, defaultValue };

    case 'boolean':
      return { propertyKind: 'CHECKBOX', displayName, description: baseDescription, required, defaultValue };

    case 'array': {
      const items = schema.items;
      if (items?.enum && items.enum.length > 0) {
        const enumOptions: EnumOption[] = items.enum.map(v => ({
          label: String(v),
          value: v as string | number,
        }));
        return {
          propertyKind: 'STATIC_MULTI_SELECT',
          displayName,
          description: baseDescription,
          required,
          defaultValue,
          enumOptions,
        };
      }
      return { propertyKind: 'ARRAY', displayName, description: baseDescription, required, defaultValue };
    }

    case 'object':
      if (schema.properties && isShallowObject(schema.properties)) {
        return { propertyKind: 'OBJECT', displayName, description: baseDescription, required, defaultValue };
      }
      return { propertyKind: 'JSON', displayName, description: baseDescription, required, defaultValue };

    case 'string':
    default: {
      const format = schema.format;
      if (format === 'date' || format === 'date-time') {
        return { propertyKind: 'DATE_TIME', displayName, description: baseDescription, required, defaultValue };
      }
      if (format === 'binary' || format === 'byte') {
        return { propertyKind: 'FILE', displayName, description: baseDescription, required };
      }
      if (format === 'textarea' || (typeof schema.maxLength === 'number' && schema.maxLength > 500)) {
        return { propertyKind: 'LONG_TEXT', displayName, description: baseDescription, required, defaultValue };
      }
      return { propertyKind: 'SHORT_TEXT', displayName, description: baseDescription, required, defaultValue };
    }
  }
}

function isShallowObject(properties: Record<string, OpenAPISchema>): boolean {
  return Object.values(properties).every(
    p => p.type !== 'object' && !p.properties && !p.allOf && !p.anyOf && !p.oneOf
  );
}

function humanize(name: string): string {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

