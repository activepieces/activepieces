import {
  isNil,
  isObject,
  FlowAction,
  FlowActionType,
  FlowTrigger,
  FlowTriggerType,
} from '@activepieces/shared';
import { t } from 'i18next';

import {
  HintField,
  OutputDisplayHints,
} from '@/components/custom/smart-output-viewer/types';
import { pieceSelectorUtils } from '@/features/pieces';

import {
  DataSelectorTreeNode,
  DataSelectorTestNodeData,
  DataSelectorTreeNodeDataUnion,
  DataSelectorTreeNodeData,
} from './type';

type PathSegment = string | number;

const MAX_CHUNK_LENGTH = 10;
const JOINED_VALUES_MAX_LENGTH = 32;

function buildTestStepNode(
  displayName: string,
  stepName: string,
): DataSelectorTreeNode<DataSelectorTreeNodeData> {
  return {
    key: stepName,
    data: {
      type: 'value',
      value: '',
      displayName,
      propertyPath: stepName,
      insertable: false,
    },
    children: [
      {
        data: {
          type: 'test',
          stepName,
          parentDisplayName: displayName,
        },
        key: `test_${stepName}`,
      },
    ],
  };
}

function buildChunkNode(
  displayName: string,
  children: DataSelectorTreeNode<DataSelectorTreeNodeDataUnion>[] | undefined,
): DataSelectorTreeNode<DataSelectorTreeNodeDataUnion> {
  return {
    key: displayName,
    data: {
      type: 'chunk',
      displayName,
    },
    children,
  };
}

type Node = {
  values: unknown[];
  properties: Record<string, Node>;
};

function mergeUniqueKeys(
  obj: Record<string, Node>,
  obj2: Record<string, Node>,
): Record<string, Node> {
  const result: Record<string, Node> = { ...obj };
  for (const [key, values] of Object.entries(obj2)) {
    const properties = mergeUniqueKeys(
      result[key]?.properties || {},
      values.properties,
    );
    result[key] = {
      values: [...(result[key]?.values || []), ...values.values],
      properties,
    };
  }
  return result;
}

function extractUniqueKeys(obj: unknown): Record<string, Node> {
  let result: Record<string, Node> = {};
  if (isObject(obj)) {
    for (const [entryKey, entryValue] of Object.entries(obj)) {
      const resultValue = result[entryKey]?.values || [];
      if (Array.isArray(entryValue)) {
        const filteredValues = entryValue.filter(
          (v) => !isObject(v) && !Array.isArray(v),
        );
        resultValue.push(...filteredValues);
      } else if (!isObject(entryValue)) {
        resultValue.push(entryValue);
      }
      const properties = extractUniqueKeys(entryValue);
      result[entryKey] = {
        values: resultValue,
        properties,
      };
    }
  } else if (Array.isArray(obj)) {
    for (const value of obj) {
      const properties = extractUniqueKeys(value);
      result = mergeUniqueKeys(result, properties);
    }
  }
  return result;
}

function convertArrayToZippedView(
  obj: Record<string, Node>,
  propertyPath: PathSegment[],
): DataSelectorTreeNode<DataSelectorTreeNodeDataUnion>[] {
  const result: DataSelectorTreeNode<DataSelectorTreeNodeDataUnion>[] = [];
  for (const [key, node] of Object.entries(obj)) {
    const stepName = propertyPath[0];
    const subPath = [...propertyPath.slice(1), key];

    const propertyPathWithFlattenArray = `flattenNestedKeys(${stepName}, ['${subPath
      .map((s) => String(s))
      .join("', '")}'])`;
    const joinedValues = node.values.join(', ');
    result.push({
      key: key,
      data: {
        type: 'value',
        value:
          joinedValues.length > JOINED_VALUES_MAX_LENGTH
            ? `${joinedValues.slice(0, JOINED_VALUES_MAX_LENGTH)}...`
            : joinedValues,
        displayName: key,
        propertyPath: propertyPathWithFlattenArray,
        insertable: true,
      },
      children:
        Object.keys(node.properties).length > 0
          ? convertArrayToZippedView(node.properties, [...propertyPath, key])
          : undefined,
    });
  }
  return result;
}

function buildJsonPath(propertyPath: PathSegment[]): string {
  const propertyPathWithoutStepName = propertyPath.slice(1);
  //need array indexes to not be quoted so we can add 1 to them when displaying the path in mention
  return propertyPathWithoutStepName.reduce((acc, segment) => {
    return `${acc}[${
      typeof segment === 'string'
        ? `'${escapeMentionKey(String(segment))}'`
        : segment
    }]`;
  }, `${propertyPath[0]}`) as string;
}

function buildDataSelectorNode(
  displayName: string,
  propertyPath: PathSegment[],
  value: unknown,
  children: DataSelectorTreeNode<DataSelectorTreeNodeDataUnion>[] | undefined,
  insertable = true,
): DataSelectorTreeNode<DataSelectorTreeNodeDataUnion> {
  const isEmptyArrayOrObject =
    (Array.isArray(value) && value.length === 0) ||
    (isObject(value) && Object.keys(value).length === 0);
  const jsonPath = buildJsonPath(propertyPath);

  return {
    key: jsonPath,
    data: {
      type: 'value',
      value: isEmptyArrayOrObject ? 'Empty List' : value,
      displayName,
      propertyPath: jsonPath,
      insertable,
    },
    children,
  };
}

function breakArrayIntoChunks<T>(
  array: T[],
  chunkSize: number,
): { items: T[]; range: { start: number; end: number } }[] {
  return Array.from(
    { length: Math.ceil(array.length / chunkSize) },
    (_, i) => ({
      items: array.slice(i * chunkSize, i * chunkSize + chunkSize),
      range: {
        start: i * chunkSize + 1,
        end: Math.min((i + 1) * chunkSize, array.length),
      },
    }),
  );
}

function traverseOutput(
  displayName: string,
  propertyPath: PathSegment[],
  node: unknown,
  zipArraysOfProperties: boolean,
  insertable = true,
): DataSelectorTreeNode<DataSelectorTreeNodeDataUnion> {
  if (Array.isArray(node)) {
    const isArrayOfObjects = node.some((value) => isObject(value));
    if (!zipArraysOfProperties || !isArrayOfObjects) {
      const mentionNodes = node.map((value, idx) =>
        traverseOutput(
          `${displayName} [${idx + 1}]`,
          [...propertyPath, idx],
          value,
          zipArraysOfProperties,
          insertable,
        ),
      );
      const chunks = breakArrayIntoChunks(mentionNodes, MAX_CHUNK_LENGTH);
      const isSingleChunk = chunks.length === 1;
      if (isSingleChunk) {
        return buildDataSelectorNode(
          displayName,
          propertyPath,
          node,
          mentionNodes,
          insertable,
        );
      }
      return buildDataSelectorNode(
        displayName,
        propertyPath,
        undefined,
        chunks.map((chunk) =>
          buildChunkNode(
            `${displayName} [${chunk.range.start}-${chunk.range.end}]`,
            chunk.items,
          ),
        ),
        insertable,
      );
    } else {
      return buildDataSelectorNode(
        displayName,
        propertyPath,
        node,
        convertArrayToZippedView(extractUniqueKeys(node), propertyPath),
        insertable,
      );
    }
  } else if (isObject(node)) {
    const children = Object.entries(node).map(([key, value]) => {
      if (zipArraysOfProperties) {
        return buildDataSelectorNode(
          key,
          [...propertyPath, key],
          value,
          convertArrayToZippedView(extractUniqueKeys(value), [
            ...propertyPath,
            key,
          ]),
          insertable,
        );
      }
      return traverseOutput(
        key,
        [...propertyPath, key],
        value,
        zipArraysOfProperties,
        insertable,
      );
    });
    return buildDataSelectorNode(
      displayName,
      propertyPath,
      node,
      children,
      insertable,
    );
  } else {
    return buildDataSelectorNode(
      displayName,
      propertyPath,
      node,
      undefined,
      insertable,
    );
  }
}

function escapeMentionKey(key: string) {
  return key.replaceAll(/[\\"'\n\r\t’]/g, (char) => `\\${char}`);
}

function getSearchableValue(
  item: DataSelectorTreeNode<DataSelectorTreeNodeDataUnion>,
) {
  if (item.data.type === 'test') {
    return item.data.parentDisplayName;
  }
  if (item.data.type === 'chunk') {
    return item.data.displayName;
  }
  if (!isNil(item.data.value)) {
    return JSON.stringify(item.data.value).toLowerCase();
  } else if (item.data.value === null) {
    return 'null';
  }
  return '';
}

function traverseStep(
  step: (FlowAction | FlowTrigger) & { dfsIndex: number },
  sampleData: Record<string, unknown>,
  zipArraysOfProperties: boolean,
): DataSelectorTreeNode<DataSelectorTreeNodeDataUnion> {
  const displayName = `${step.dfsIndex + 1}. ${step.displayName}`;
  const stepNeedsTesting =
    isNil(step.settings.sampleData?.lastTestDate) &&
    (step.type !== FlowTriggerType.PIECE ||
      !pieceSelectorUtils.isManualTrigger({
        pieceName: step.settings.pieceName,
        triggerName: step.settings.triggerName ?? '',
      }));
  if (stepNeedsTesting) {
    return buildTestStepNode(displayName, step.name);
  }
  if (step.type === FlowActionType.LOOP_ON_ITEMS) {
    const copiedSampleData = JSON.parse(JSON.stringify(sampleData[step.name]));
    delete copiedSampleData['iterations'];
    const headNode = traverseOutput(
      displayName,
      [step.name],
      copiedSampleData,
      zipArraysOfProperties,
      true,
    );
    headNode.isLoopStepNode = true;
    return headNode;
  }

  return traverseOutput(
    displayName,
    [step.name],
    sampleData[step.name],
    zipArraysOfProperties,
    true,
  );
}

function filterBy(
  mentions: DataSelectorTreeNode[],
  query: string | undefined,
): DataSelectorTreeNode<DataSelectorTreeNodeDataUnion>[] {
  if (!query) {
    return mentions;
  }

  const res = mentions
    .map((item) => {
      const filteredChildren = !isNil(item.children)
        ? filterBy(item.children, query)
        : undefined;

      if (filteredChildren && filteredChildren.length) {
        return {
          ...item,
          children: filteredChildren,
        };
      }
      const searchableValue = getSearchableValue(item);

      const displayName =
        item.data.type === 'value' ? item.data.displayName.toLowerCase() : '';
      const matchDisplayNameOrValue =
        displayName.toLowerCase().includes(query.toLowerCase()) ||
        searchableValue.toLowerCase().includes(query.toLowerCase());
      if (matchDisplayNameOrValue) {
        return item;
      }
      return null;
    })
    .filter(
      (f) => !isNil(f),
    ) as DataSelectorTreeNode<DataSelectorTreeNodeDataUnion>[];
  return res;
}

function convertValuePathToPropertyPath(
  stepName: string,
  valuePath: string,
): string {
  const segments = parsePath(valuePath);
  return segments.reduce<string>((acc, segment) => {
    if (typeof segment === 'number') {
      return `${acc}[${segment}]`;
    }
    return `${acc}['${escapeMentionKey(segment)}']`;
  }, stepName);
}

function parsePath(path: string): Array<string | number> {
  const segments: Array<string | number> = [];
  let i = 0;
  let buf = '';
  const flushBuf = () => {
    if (buf.length > 0) {
      segments.push(buf);
      buf = '';
    }
  };
  while (i < path.length) {
    const ch = path[i];
    if (ch === '.') {
      flushBuf();
      i++;
    } else if (ch === '[') {
      flushBuf();
      i++;
      if (path[i] === '"' || path[i] === "'") {
        const quote = path[i];
        i++;
        let key = '';
        while (i < path.length && path[i] !== quote) {
          if (path[i] === '\\' && i + 1 < path.length) {
            key += path[i + 1];
            i += 2;
          } else {
            key += path[i];
            i++;
          }
        }
        i++;
        while (i < path.length && path[i] !== ']') i++;
        i++;
        segments.push(key);
      } else {
        let num = '';
        while (i < path.length && path[i] !== ']') {
          num += path[i];
          i++;
        }
        i++;
        const n = parseInt(num, 10);
        segments.push(isNaN(n) ? num : n);
      }
    } else {
      buf += ch;
      i++;
    }
  }
  flushBuf();
  return segments;
}

const COMMON_WRAPPERS_FOR_FALLBACK = [
  'properties',
  'data',
  'body',
  'payload',
  'result',
  'response',
  'value',
  'attributes',
  'fields',
];

function resolveSegments(
  obj: unknown,
  segments: Array<string | number>,
): unknown {
  let current: unknown = obj;
  for (const segment of segments) {
    if (Array.isArray(current)) {
      const idx =
        typeof segment === 'number' ? segment : parseInt(String(segment), 10);
      current = current[idx];
    } else if (isObject(current)) {
      current = current[String(segment)];
    } else {
      return undefined;
    }
  }
  return current;
}

function resolvePathWithFallback(
  obj: unknown,
  path: string,
): { value: unknown; resolvedPath: string } {
  if (!isObject(obj) && !Array.isArray(obj)) {
    return { value: undefined, resolvedPath: path };
  }
  const segments = parsePath(path);
  const direct = resolveSegments(obj, segments);
  if (!isNil(direct)) return { value: direct, resolvedPath: path };

  if (segments.length === 0 || !isObject(obj)) {
    return { value: direct, resolvedPath: path };
  }
  const rootKeys = Object.keys(obj);
  for (const wrapper of COMMON_WRAPPERS_FOR_FALLBACK) {
    if (!rootKeys.includes(wrapper)) continue;
    if (segments[0] === wrapper) continue;
    const fallbackSegments = [wrapper, ...segments];
    const fallback = resolveSegments(obj, fallbackSegments);
    if (!isNil(fallback)) {
      return {
        value: fallback,
        resolvedPath: `${wrapper}.${path}`,
      };
    }
  }
  return { value: direct, resolvedPath: path };
}

function resolveLabel(field: HintField): string {
  if (field.label) return field.label;
  return formatKeyLabel(field.key);
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
  const { value, resolvedPath } = resolvePathWithFallback(sampleData, rawPath);
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
  const { value, resolvedPath } = resolvePathWithFallback(sampleData, fullPath);
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
  const { value, resolvedPath: valuePath } = resolvePathWithFallback(
    sampleData,
    rawValuePath,
  );
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

function formatKeyLabel(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
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
                    displayName: formatKeyLabel(nestedKey),
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
              displayName: formatKeyLabel(key),
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

export const dataSelectorUtils = {
  isTestStepNode: (
    node: DataSelectorTreeNode,
  ): node is DataSelectorTreeNode<DataSelectorTestNodeData> =>
    node.data.type === 'test',
  traverseStep,
  buildTreeFromHints,
  buildTreeFromArray,
  filterBy,
};
