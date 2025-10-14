import {
  isNil,
  isObject,
  FlowAction,
  FlowActionType,
  FlowTrigger,
} from '@activepieces/shared';

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
  const stepNeedsTesting = isNil(step.settings.sampleData?.lastTestDate);
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

export const dataSelectorUtils = {
  isTestStepNode: (
    node: DataSelectorTreeNode,
  ): node is DataSelectorTreeNode<DataSelectorTestNodeData> =>
    node.data.type === 'test',
  traverseStep,
  filterBy,
};
