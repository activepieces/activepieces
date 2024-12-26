import {
  Action,
  ActionType,
  isNil,
  Trigger,
  isObject,
} from '@activepieces/shared';

import {
  MentionTreeNode,
  MentionTestNodeData,
  MentionTreeNodeDataUnion,
  MentionTreeNodeData,
} from './type';

type PathSegment = string | number;

const MAX_CHUNK_LENGTH = 10;

function buildTestStepNode(
  displayName: string,
  stepName: string,
): MentionTreeNode<MentionTreeNodeData> {
  return {
    key: stepName,
    data: {
      type: 'value',
      value: displayName,
      displayName,
      propertyPath: stepName,
      insertable: false,
    },
    children: [
      {
        data: {
          type: 'test',
          stepName,
        },
        key: `test_${stepName}`,
      },
    ],
  };
}

function buildChunkNode(
  displayName: string,
  children: MentionTreeNode<MentionTreeNodeDataUnion>[] | undefined,
): MentionTreeNode<MentionTreeNodeDataUnion> {
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
    for (const [key, value] of Object.entries(obj)) {
      const values = result[key]?.values || [];
      if (Array.isArray(value)) {
        const filteredValues = value.filter(
          (v) => !isObject(v) && !Array.isArray(v),
        );
        values.push(...filteredValues);
      } else if (!isObject(value)) {
        values.push(value);
      }
      const properties = extractUniqueKeys(value);
      result[key] = {
        values,
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
): MentionTreeNode<MentionTreeNodeDataUnion>[] {
  const result: MentionTreeNode<MentionTreeNodeDataUnion>[] = [];
  for (const [key, node] of Object.entries(obj)) {
    const stepName = propertyPath[0];
    const subPath = [...propertyPath.slice(1), key];
    const propertyPathWithFlatternArray = `flattenNestedKeys(${stepName}, ['${subPath
      .map((s) => String(s))
      .join("', '")}'])`;
    result.push({
      key: key,
      data: {
        type: 'value',
        value: node.values.join(', ').slice(0, 32),
        displayName: key,
        propertyPath: propertyPathWithFlatternArray,
        insertable: true,
      },
      children:
        Object.keys(node.properties).length > 0
          ? convertArrayToZippedView(node.properties, subPath)
          : undefined,
    });
  }
  return result;
}

function buildJsonPath(propertyPath: PathSegment[]): string {
  let jsonPath = String(propertyPath[0]);
  for (const segment of propertyPath.slice(1)) {
    jsonPath += `['${escapeMentionKey(String(segment))}']`;
  }
  return jsonPath;
}

function buildMentionNode(
  displayName: string,
  propertyPath: PathSegment[],
  value: unknown,
  children: MentionTreeNode<MentionTreeNodeDataUnion>[] | undefined,
  insertable = true,
): MentionTreeNode<MentionTreeNodeDataUnion> {
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
  return Array.from({ length: Math.ceil(array.length / chunkSize) }, (_, i) => ({
    items: array.slice(i * chunkSize, i * chunkSize + chunkSize),
    range: {
      start: i * chunkSize + 1,
      end: Math.min((i + 1) * chunkSize, array.length),
    },
  }));
}

function traverseOutput(
  displayName: string,
  propertyPath: PathSegment[],
  node: unknown,
  zipArraysOfProperties: boolean,
  insertable = true,
): MentionTreeNode<MentionTreeNodeDataUnion> {
  if (Array.isArray(node)) {
    if(!zipArraysOfProperties)
    {
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
        return buildMentionNode(
          displayName,
          propertyPath,
          node,
          mentionNodes,
          insertable,
        );
      }
      return buildMentionNode(
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
    }
    else {
      return buildMentionNode(
        displayName,
        propertyPath,
        node,
        convertArrayToZippedView(extractUniqueKeys(node), propertyPath),
        insertable,
      );
    }
    
  } else if (isObject(node)) {
    const children = Object.entries(node).map(([key, value]) => {
      if (Array.isArray(value) && zipArraysOfProperties) {
        return buildMentionNode(
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
    return buildMentionNode(
      displayName,
      propertyPath,
      node,
      children,
      insertable,
    );
  } else {
    return buildMentionNode(
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

function traverseStep(
  step: (Action | Trigger) & { dfsIndex: number },
  sampleData: Record<string, unknown>,
  zipArraysOfProperties: boolean,
): MentionTreeNode<MentionTreeNodeDataUnion> {
  const displayName = `${step.dfsIndex + 1}. ${step.displayName}`;
  const stepNeedsTesting = isNil(step.settings.inputUiInfo?.lastTestDate);
  if (stepNeedsTesting) {
    return buildTestStepNode(displayName, step.name);
  }
  return traverseOutput(
    displayName,
    [step.name],
    sampleData[step.name],
    zipArraysOfProperties,
    step.type !== ActionType.LOOP_ON_ITEMS,
  );
}

function filterBy(
  mentions: MentionTreeNode[],
  query: string | undefined,
): MentionTreeNode<MentionTreeNodeDataUnion>[] {
  if (!query) {
    return mentions;
  }
  return mentions
    .map((item) => {
      const isTestNode = item.data.type === 'test';
      if (isTestNode) {
        return null;
      }
      const filteredChildren = !isNil(item.children)
        ? filterBy(item.children, query)
        : undefined;
      if (filteredChildren && filteredChildren.length) {
        return {
          ...item,
          children: filteredChildren,
        };
      }
      const searchableValue = isNil(item) || item.data.type === 'test' || item.data.type === 'chunk'
         ? ''
        : JSON.stringify(item?.data?.value).toLowerCase();

      const displayName = item?.data?.type === 'value' ? item?.data?.displayName?.toLowerCase() : '';
      const matchDisplayNameOrValue =
        displayName?.includes(query.toLowerCase()) ||
        searchableValue.includes(query.toLowerCase());
      if (matchDisplayNameOrValue) {
        return {
          ...item,
          children: undefined,
        };
      }
      return null;
    })
    .filter((f) => !isNil(f)) as MentionTreeNode<MentionTreeNodeDataUnion>[];
}

export const dataSelectorMentions = {
  isTestStepNode: (
    node: MentionTreeNode,
  ): node is MentionTreeNode<MentionTestNodeData> => node.data.type === 'test',
  traverseStep,
  filterBy,
};
