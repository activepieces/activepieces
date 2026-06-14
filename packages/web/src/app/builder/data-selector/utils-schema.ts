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

function buildFieldNode({
  basePath,
  field,
  sampleData,
  itemLabelTemplate,
}: {
  basePath: string;
  field: OutputSchemaField;
  sampleData: unknown;
  itemLabelTemplate?: string;
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
      const fallback = `${label} ${idx + 1}`;
      const itemLabel = itemLabelTemplate
        ? schemaUtils.resolveTemplateLabel({
            value: itemValue,
            template: itemLabelTemplate,
            fallback,
          })
        : schemaUtils.resolveEntryLabel({
            value: itemValue,
            labelKey: field.labelKey,
            fallback,
          });
      const itemBase = pathHelpers.appendValuePathToPropertyPath(
        basePath,
        `${valuePath}[${idx}]`,
      );
      // Build each item field through buildFieldNode (not a flat leaf) so a
      // listItem that is itself a container — a nested object, a dynamicKey map,
      // another array — drills in instead of dead-ending at a raw value.
      // Key by field index, not the resolved path: two whole-item (value:'')
      // children would otherwise collide on the same propertyPath-based key.
      const itemChildren = listItems.map((child, childIdx) => {
        const childNode = buildFieldNode({
          basePath: itemBase,
          field: child,
          sampleData: itemValue,
        });
        return { ...childNode, key: `${itemBase}_field_${childIdx}` };
      });
      return {
        key: `${propertyPath}_item_${idx}`,
        data: {
          type: 'value' as const,
          // Carry the real item so its type icon reflects the item (object => {},
          // array => list) instead of defaulting to the text icon.
          value: itemValue,
          displayName: itemLabel,
          propertyPath: itemBase,
          insertable: false,
        },
        children: itemChildren,
      };
    });
    return {
      key: propertyPath,
      data: {
        type: 'value' as const,
        // Carry the real array (not a formatted count string) so the node shows
        // the list icon + item-count badge, matching the matrix/primitive/generic
        // array branches and the output viewer.
        value,
        displayName: label,
        propertyPath,
        insertable: false,
      },
      children: listChildren,
    };
  }

  if (
    !field.listItems?.length &&
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

  if (field.children && field.children.length > 0 && isObject(value)) {
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

  // The schema names this field but not its inner structure. Mirror the output
  // viewer: drill matrices into rows/cells and other containers into their full
  // (schemaless) contents, so no described field dead-ends at a bare value.
  if (schemaUtils.isMatrixArray(value)) {
    const rowNodes = value.map((row, rowIdx) => {
      const rowPath = pathHelpers.appendValuePathToPropertyPath(
        basePath,
        `${valuePath}[${rowIdx}]`,
      );
      const cellNodes = row.map((cell, cellIdx) => {
        const cellPath = pathHelpers.appendValuePathToPropertyPath(
          basePath,
          `${valuePath}[${rowIdx}][${cellIdx}]`,
        );
        return {
          key: cellPath,
          data: {
            type: 'value' as const,
            value: cell,
            displayName: `${t('Cell')} ${cellIdx + 1}`,
            propertyPath: cellPath,
            insertable: true,
          },
        };
      });
      return {
        key: rowPath,
        data: {
          type: 'value' as const,
          value: row,
          displayName: `${t('Row')} ${rowIdx + 1}`,
          propertyPath: rowPath,
          insertable: true,
        },
        children: cellNodes,
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
      children: rowNodes,
    };
  }

  if (Array.isArray(value) && value.length > 0) {
    const itemNodes = value.map((item, idx) => {
      const itemPath = pathHelpers.appendValuePathToPropertyPath(
        basePath,
        `${valuePath}[${idx}]`,
      );
      return buildSampleValueNode({
        value: item,
        displayName: `${t('Item')} ${idx + 1}`,
        path: itemPath,
      });
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
      children: itemNodes,
    };
  }

  if (isObject(value) && Object.keys(value).length > 0) {
    return buildSampleValueNode({
      value,
      displayName: label,
      path: propertyPath,
    });
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
    buildFieldNode({
      basePath,
      field,
      sampleData,
      // A field that IS the whole output (value:'') over a top-level array is the
      // array's wrapper; label its rows with the schema's array itemLabel template.
      itemLabelTemplate: field.value === '' ? schema.itemLabel : undefined,
    }),
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
        // Carry the real object so the node shows the {} icon, not the text icon.
        value,
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
    items.map((item, idx) =>
      buildSampleValueNode({
        value: item,
        displayName: `${t('Item')} ${idx + 1}`,
        path: `${pathHelpers.propertyPathStarter(stepName)}[${idx}]`,
      }),
    );

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
        // Carry the real item so its type icon reflects the item, not text.
        value: item,
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

function selectArrayTreeKind(
  schema: OutputSchema | null | undefined,
): 'wrapper' | 'perItem' | 'plain' {
  if (isNil(schema)) return 'plain';
  return schemaUtils.isWholeOutputSchema(schema) ? 'wrapper' : 'perItem';
}

export const schemaTreeUtils = {
  buildTreeFromSchema,
  buildTreeFromArray,
  buildTreeFromArrayWithSchema,
  selectArrayTreeKind,
};
