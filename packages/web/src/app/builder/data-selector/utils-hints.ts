import { isNil, isObject } from '@activepieces/shared';
import { t } from 'i18next';

import {
  HintField,
  OutputDisplayHints,
} from '@/components/custom/smart-output-viewer/types';
import { pathUtils } from '@/lib/path-utils';
import { stringUtils } from '@/lib/string-utils';

import { DataSelectorTreeNode, DataSelectorTreeNodeDataUnion } from './type';
import { convertValuePathToPropertyPath, escapeMentionKey } from './utils';

function resolveLabel(field: HintField): string {
  return field.label ?? stringUtils.titleCase(field.key);
}

function resolveChildPath(child: HintField, parentPath: string): string {
  if (child.value) return child.value;
  return `${parentPath}.${child.key}`;
}

function resolveItemChildPath(child: HintField): string {
  return child.value ?? child.key;
}

function buildFieldChildNode(
  stepName: string,
  child: HintField,
  sampleData: unknown,
  parentPath: string,
): DataSelectorTreeNode<DataSelectorTreeNodeDataUnion> {
  const rawPath = resolveChildPath(child, parentPath);
  const { value, resolvedPath } = pathUtils.resolvePathWithWrapperFallback(
    sampleData,
    rawPath,
  );
  const propertyPath = convertValuePathToPropertyPath(stepName, resolvedPath);

  return {
    key: propertyPath,
    data: {
      type: 'value',
      value,
      displayName: resolveLabel(child),
      propertyPath,
      insertable: true,
    },
  };
}

function buildItemChildNode(
  stepName: string,
  child: HintField,
  parentArrayPath: string,
  itemIndex: number,
  sampleData: unknown,
): DataSelectorTreeNode<DataSelectorTreeNodeDataUnion> {
  const relativePath = resolveItemChildPath(child);
  const fullPath = `${parentArrayPath}[${itemIndex}].${relativePath}`;
  const { value, resolvedPath } = pathUtils.resolvePathWithWrapperFallback(
    sampleData,
    fullPath,
  );
  const propertyPath = convertValuePathToPropertyPath(stepName, resolvedPath);

  return {
    key: propertyPath,
    data: {
      type: 'value',
      value,
      displayName: resolveLabel(child),
      propertyPath,
      insertable: true,
    },
  };
}

function buildFieldNode(
  stepName: string,
  field: HintField,
  sampleData: unknown,
): DataSelectorTreeNode<DataSelectorTreeNodeDataUnion> {
  const rawValuePath = field.value ?? field.key;
  const { value, resolvedPath: valuePath } =
    pathUtils.resolvePathWithWrapperFallback(sampleData, rawValuePath);
  const propertyPath = convertValuePathToPropertyPath(stepName, valuePath);
  const label = resolveLabel(field);

  if (field.listItems && field.listItems.length > 0 && Array.isArray(value)) {
    const listItems = field.listItems;
    const listChildren = value.map((_, idx) => {
      const itemLabel = `${label} ${idx + 1}`;
      const itemChildren = listItems.map((child) =>
        buildItemChildNode(stepName, child, valuePath, idx, sampleData),
      );
      return {
        key: `${propertyPath}_item_${idx}`,
        data: {
          type: 'value' as const,
          value: '',
          displayName: itemLabel,
          propertyPath: convertValuePathToPropertyPath(
            stepName,
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
        value: `${value.length} ${t('items')}`,
        displayName: label,
        propertyPath,
        insertable: false,
      },
      children: listChildren,
    };
  }

  if (field.dynamicKey === true && isObject(value)) {
    const dynamicChildren: DataSelectorTreeNode<DataSelectorTreeNodeDataUnion>[] =
      Object.entries(value).map(([key, childValue]) => {
        const childPath = `${propertyPath}['${escapeMentionKey(key)}']`;
        return {
          key: childPath,
          data: {
            type: 'value' as const,
            value: childValue,
            displayName: key,
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
      },
      children: dynamicChildren,
    };
  }

  if (field.children && field.children.length > 0) {
    const childNodes = field.children.map((child) =>
      buildFieldChildNode(stepName, child, sampleData, valuePath),
    );
    return {
      key: propertyPath,
      data: {
        type: 'value' as const,
        value,
        displayName: label,
        propertyPath,
        insertable: true,
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
    },
  };
}

function buildTreeFromHints({
  stepName,
  displayName,
  hints,
  sampleData,
}: {
  stepName: string;
  displayName: string;
  hints: OutputDisplayHints;
  sampleData: unknown;
}): DataSelectorTreeNode<DataSelectorTreeNodeDataUnion> {
  const allFields = [...(hints.hero ?? []), ...(hints.secondary ?? [])];
  const children = allFields.map((field) =>
    buildFieldNode(stepName, field, sampleData),
  );

  return {
    key: stepName,
    data: {
      type: 'value',
      value: '',
      displayName,
      propertyPath: stepName,
      insertable: false,
    },
    children,
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
      const itemPath = `${stepName}[${idx}]`;

      if (!isObject(item)) {
        return {
          key: itemPath,
          data: {
            type: 'value' as const,
            value: item,
            displayName: `${t('Item')} ${idx + 1}`,
            propertyPath: itemPath,
            insertable: true,
          },
        };
      }

      const itemChildren: DataSelectorTreeNode<DataSelectorTreeNodeDataUnion>[] =
        Object.entries(item).map(([key, value]) => {
          const childPath = `${itemPath}['${escapeMentionKey(key)}']`;
          const nestedChildren = isObject(value)
            ? Object.entries(value).map(([nestedKey, nestedValue]) => {
                const nestedPath = `${childPath}['${escapeMentionKey(
                  nestedKey,
                )}']`;
                return {
                  key: nestedPath,
                  data: {
                    type: 'value' as const,
                    value: nestedValue,
                    displayName: stringUtils.titleCase(nestedKey),
                    propertyPath: nestedPath,
                    insertable: true,
                  },
                };
              })
            : undefined;
          return {
            key: childPath,
            data: {
              type: 'value' as const,
              value: nestedChildren ? '' : value,
              displayName: stringUtils.titleCase(key),
              propertyPath: childPath,
              insertable: true,
            },
            children: nestedChildren,
          };
        });

      const preview = Object.values(item)
        .filter((v) => !isNil(v) && v !== '' && typeof v !== 'object')
        .slice(0, 3)
        .map((v) => {
          const s = String(v);
          return s.length > 20 ? s.slice(0, 20) + '...' : s;
        })
        .join(' · ');

      return {
        key: itemPath,
        data: {
          type: 'value' as const,
          value: preview,
          displayName: `${t('Item')} ${idx + 1}`,
          propertyPath: itemPath,
          insertable: true,
        },
        children: itemChildren,
      };
    });

  return {
    key: stepName,
    data: {
      type: 'value',
      value: `${items.length} ${t('items')}`,
      displayName,
      propertyPath: stepName,
      insertable: false,
    },
    children,
  };
}

export const hintsTreeUtils = { buildTreeFromHints, buildTreeFromArray };
