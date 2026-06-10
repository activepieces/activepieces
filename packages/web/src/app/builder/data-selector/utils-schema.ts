import { isNil, isObject } from '@activepieces/shared';
import { t } from 'i18next';

import { schemaUtils } from '@/components/custom/smart-output-viewer/resolve-schema';
import {
  OutputSchemaField,
  OutputSchema,
} from '@/components/custom/smart-output-viewer/types';
import { pathUtils } from '@/lib/path-utils';
import { stringUtils } from '@/lib/string-utils';

import { pathHelpers } from './path-helpers';
import {
  DataSelectorTreeNode,
  DataSelectorTreeNodeData,
  DataSelectorTreeNodeDataUnion,
} from './type';

function buildFieldChildNode({
  basePath,
  child,
  sampleData,
  parentPath,
}: {
  basePath: string;
  child: OutputSchemaField;
  sampleData: unknown;
  parentPath: string;
}): DataSelectorTreeNode<DataSelectorTreeNodeDataUnion> {
  const rawPath = schemaUtils.resolveFieldPath(child, parentPath);
  const { value, resolvedPath } = pathUtils.resolvePathWithWrapperFallback(
    sampleData,
    rawPath,
  );
  const propertyPath = pathHelpers.appendValuePathToPropertyPath(
    basePath,
    resolvedPath,
  );

  return {
    key: propertyPath,
    data: {
      type: 'value',
      value,
      displayName: schemaUtils.resolveFieldLabel(child),
      propertyPath,
      insertable: true,
      format: child.format,
    },
  };
}

function buildItemChildNode({
  basePath,
  child,
  parentArrayPath,
  itemIndex,
  sampleData,
}: {
  basePath: string;
  child: OutputSchemaField;
  parentArrayPath: string;
  itemIndex: number;
  sampleData: unknown;
}): DataSelectorTreeNode<DataSelectorTreeNodeDataUnion> {
  const relativePath = schemaUtils.resolveItemFieldPath(child);
  const fullPath = `${parentArrayPath}[${itemIndex}].${relativePath}`;
  const { value, resolvedPath } = pathUtils.resolvePathWithWrapperFallback(
    sampleData,
    fullPath,
  );
  const propertyPath = pathHelpers.appendValuePathToPropertyPath(
    basePath,
    resolvedPath,
  );

  return {
    key: propertyPath,
    data: {
      type: 'value',
      value,
      displayName: schemaUtils.resolveFieldLabel(child),
      propertyPath,
      insertable: true,
      format: child.format,
    },
  };
}

function buildFieldNode({
  basePath,
  field,
  sampleData,
}: {
  basePath: string;
  field: OutputSchemaField;
  sampleData: unknown;
}): DataSelectorTreeNode<DataSelectorTreeNodeDataUnion> {
  const rawValuePath = field.value ?? field.key;
  const { value, resolvedPath: valuePath } =
    pathUtils.resolvePathWithWrapperFallback(sampleData, rawValuePath);
  const propertyPath = pathHelpers.appendValuePathToPropertyPath(
    basePath,
    valuePath,
  );
  const label = schemaUtils.resolveFieldLabel(field);

  if (field.listItems && field.listItems.length > 0 && Array.isArray(value)) {
    const listItems = field.listItems;
    const listChildren = value.map((itemValue, idx) => {
      const itemLabel = schemaUtils.resolveEntryLabel({
        value: itemValue,
        labelKey: field.labelKey,
        fallback: `${label} ${idx + 1}`,
      });
      const itemChildren = listItems.map((child) =>
        buildItemChildNode({
          basePath,
          child,
          parentArrayPath: valuePath,
          itemIndex: idx,
          sampleData,
        }),
      );
      return {
        key: `${propertyPath}_item_${idx}`,
        data: {
          type: 'value' as const,
          value: '',
          displayName: itemLabel,
          propertyPath: pathHelpers.appendValuePathToPropertyPath(
            basePath,
            `${valuePath}[${idx}]`,
          ),
          insertable: false,
        },
        children: itemChildren,
      };
    });
    return {
      key: propertyPath,
      data: {
        type: 'value' as const,
        value: t('itemCount', { count: value.length }),
        displayName: label,
        propertyPath,
        insertable: false,
      },
      children: listChildren,
    };
  }

  if (
    !field.listItems &&
    Array.isArray(value) &&
    schemaUtils.isPrimitiveArray(value)
  ) {
    const itemChildren = value.map((itemValue, idx) => {
      const itemPath = pathHelpers.appendValuePathToPropertyPath(
        basePath,
        `${valuePath}[${idx}]`,
      );
      return {
        key: itemPath,
        data: {
          type: 'value' as const,
          value: itemValue,
          displayName: `${label} ${idx + 1}`,
          propertyPath: itemPath,
          insertable: true,
        },
      };
    });
    return {
      key: propertyPath,
      data: {
        type: 'value' as const,
        value,
        displayName: label,
        propertyPath,
        insertable: true,
        format: field.format,
      },
      children: itemChildren.length > 0 ? itemChildren : undefined,
    };
  }

  if (field.dynamicKey === true && isObject(value)) {
    const dynamicChildren: DataSelectorTreeNode<DataSelectorTreeNodeDataUnion>[] =
      Object.entries(value).map(([key, childValue]) => {
        const childPath = `${propertyPath}['${pathHelpers.escapeMentionKey(
          key,
        )}']`;
        return {
          key: childPath,
          data: {
            type: 'value' as const,
            value: childValue,
            displayName: schemaUtils.resolveEntryLabel({
              value: childValue,
              labelKey: field.labelKey,
              fallback: key,
            }),
            propertyPath: childPath,
            insertable: true,
          },
        };
      });
    return {
      key: propertyPath,
      data: {
        type: 'value' as const,
        value,
        displayName: label,
        propertyPath,
        insertable: true,
        format: field.format,
      },
      children: dynamicChildren,
    };
  }

  if (field.children && field.children.length > 0) {
    const childNodes = field.children.map((child) =>
      buildFieldChildNode({
        basePath,
        child,
        sampleData,
        parentPath: valuePath,
      }),
    );
    return {
      key: propertyPath,
      data: {
        type: 'value' as const,
        value,
        displayName: label,
        propertyPath,
        insertable: true,
        format: field.format,
      },
      children: childNodes,
    };
  }

  return {
    key: propertyPath,
    data: {
      type: 'value' as const,
      value,
      displayName: label,
      propertyPath,
      insertable: true,
      format: field.format,
    },
  };
}

function buildTreeFromSchema({
  stepName,
  displayName,
  schema,
  sampleData,
}: {
  stepName: string;
  displayName: string;
  schema: OutputSchema;
  sampleData: unknown;
}): DataSelectorTreeNode<DataSelectorTreeNodeDataUnion> {
  const fields = schema.fields ?? [];
  const basePath = pathHelpers.propertyPathStarter(stepName);
  const children = fields.map((field) =>
    buildFieldNode({ basePath, field, sampleData }),
  );

  return {
    key: stepName,
    data: {
      type: 'value',
      value: '',
      displayName,
      propertyPath: basePath,
      insertable: true,
      stepName,
    },
    children,
  };
}

function buildSampleValueNode({
  value,
  displayName,
  path,
}: {
  value: unknown;
  displayName: string;
  path: string;
}): DataSelectorTreeNode<DataSelectorTreeNodeData> {
  if (Array.isArray(value) && value.length > 0) {
    const children = value.map((itemValue, idx) =>
      buildSampleValueNode({
        value: itemValue,
        displayName: `${displayName} ${idx + 1}`,
        path: `${path}[${idx}]`,
      }),
    );
    return {
      key: path,
      data: {
        type: 'value',
        value,
        displayName,
        propertyPath: path,
        insertable: true,
      },
      children,
    };
  }

  if (isObject(value) && Object.keys(value).length > 0) {
    const children = Object.entries(value).map(([key, childValue]) =>
      buildSampleValueNode({
        value: childValue,
        displayName: stringUtils.titleCase(key),
        path: `${path}['${pathHelpers.escapeMentionKey(key)}']`,
      }),
    );
    return {
      key: path,
      data: {
        type: 'value',
        value: '',
        displayName,
        propertyPath: path,
        insertable: true,
      },
      children,
    };
  }

  return {
    key: path,
    data: {
      type: 'value',
      value,
      displayName,
      propertyPath: path,
      insertable: true,
    },
  };
}

function buildTreeFromArray({
  stepName,
  displayName,
  items,
}: {
  stepName: string;
  displayName: string;
  items: unknown[];
}): DataSelectorTreeNode<DataSelectorTreeNodeDataUnion> {
  const children: DataSelectorTreeNode<DataSelectorTreeNodeDataUnion>[] =
    items.map((item, idx) => {
      const itemPath = `${pathHelpers.propertyPathStarter(stepName)}[${idx}]`;
      const itemNode = buildSampleValueNode({
        value: item,
        displayName: `${t('Item')} ${idx + 1}`,
        path: itemPath,
      });

      if (!isObject(item)) {
        return itemNode;
      }

      const preview = Object.values(item)
        .filter((v) => !isNil(v) && v !== '' && typeof v !== 'object')
        .slice(0, 3)
        .map((v) => {
          const s = String(v);
          return s.length > 20 ? s.slice(0, 20) + '...' : s;
        })
        .join(' · ');

      return {
        ...itemNode,
        data: { ...itemNode.data, value: preview },
      };
    });

  return {
    key: stepName,
    data: {
      type: 'value',
      value: t('itemCount', { count: items.length }),
      displayName,
      propertyPath: pathHelpers.propertyPathStarter(stepName),
      insertable: true,
      stepName,
    },
    children,
  };
}

function buildTreeFromArrayWithSchema({
  stepName,
  displayName,
  schema,
  items,
}: {
  stepName: string;
  displayName: string;
  schema: OutputSchema;
  items: unknown[];
}): DataSelectorTreeNode<DataSelectorTreeNodeDataUnion> {
  const fields = schema.fields ?? [];
  const children = items.map((item, idx) => {
    const itemBase = `${pathHelpers.propertyPathStarter(stepName)}[${idx}]`;
    const itemLabel = schema.itemLabel
      ? schemaUtils.resolveTemplateLabel({
          value: item,
          template: schema.itemLabel,
          fallback: `${t('Item')} ${idx + 1}`,
        })
      : `${t('Item')} ${idx + 1}`;

    return {
      key: itemBase,
      data: {
        type: 'value' as const,
        value: '',
        displayName: itemLabel,
        propertyPath: itemBase,
        insertable: true,
      },
      children: fields.map((field) =>
        buildFieldNode({ basePath: itemBase, field, sampleData: item }),
      ),
    };
  });

  return {
    key: stepName,
    data: {
      type: 'value',
      value: t('itemCount', { count: items.length }),
      displayName,
      propertyPath: pathHelpers.propertyPathStarter(stepName),
      insertable: true,
      stepName,
    },
    children,
  };
}

export const schemaTreeUtils = {
  buildTreeFromSchema,
  buildTreeFromArray,
  buildTreeFromArrayWithSchema,
};
