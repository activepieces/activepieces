export type MentionTreeNode = {
  key: string;
  data: {
    propertyPath: string;
    displayName: string;
    value?: string | unknown;
    isSlice?: boolean;
    insertable: boolean;
    isTestStepNode?: boolean;
  };
  children?: MentionTreeNode[];
};

type HandleStepOutputProps = {
  stepOutput: unknown;
  propertyPath: string;
  displayName: string;
  insertable?: boolean;
  combineArray?: boolean;
};

function extractUniqueJsonPaths(
  obj: unknown,
  currentPath: string[] = [],
  uniquePathsMap: Record<string, unknown> = {}
): void {
  if (Array.isArray(obj)) {
    obj.forEach((item) => extractUniqueJsonPaths(item, currentPath, uniquePathsMap));
  } else if (obj && typeof obj === "object") {
    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === "object" && !Array.isArray(value)) {
        // Handle nested objects by initializing them in the map if not present
        if (!uniquePathsMap[key]) {
          uniquePathsMap[key] = {};
        }
        extractUniqueJsonPaths(value, [...currentPath, key], uniquePathsMap[key] as Record<string, unknown>);
      } else {
        // Handle flat properties
        if (!uniquePathsMap[key]) {
          uniquePathsMap[key] = [];
        }
        if (Array.isArray(uniquePathsMap[key]) && !((uniquePathsMap[key] as unknown[]).includes(value))) {
          (uniquePathsMap[key] as unknown[]).push(value);
        }
      }
    });
  }
}

function buildNodeTreeFromUniquePaths(uniquePathsMap: Record<string, unknown>, parentPath: string = ''): MentionTreeNode[] | undefined {
  if (Array.isArray(uniquePathsMap)) {
    return undefined;
  }
  return Object.keys(uniquePathsMap).map((key) => {
    const fullPath = parentPath ? `${parentPath}.${key}` : key;
    const firstKey = key.split('.')[0];
    return {
      key,
      data: {
        propertyPath: `flattenArrayPath(${firstKey},\`${fullPath}\`)`,
        displayName: key,
        value: uniquePathsMap[key],
        insertable: true
      },
      children: buildNodeTreeFromUniquePaths(uniquePathsMap[key] as Record<string, unknown>, fullPath)
    }
  })
}
function handleCombinedArrayStepOutput(
  stepOutput: unknown[],
  path: string,
  parentDisplayName: string,
  insertable: boolean,
): MentionTreeNode {

  const uniquePathsMap: Record<string, unknown[]> = {};
  extractUniqueJsonPaths(stepOutput, [], uniquePathsMap);

  return {
    key: path,
    data: {
      propertyPath: path,
      displayName: parentDisplayName,
      insertable,
      value: stepOutput.length === 0 ? 'Empty List' : undefined
    },
    children: buildNodeTreeFromUniquePaths(uniquePathsMap, path)
  };
}

function traverseStepOutputAndReturnMentionTree({
  stepOutput,
  propertyPath,
  displayName,
  insertable = true,
  combineArray = false
}: HandleStepOutputProps): MentionTreeNode {
  if (Array.isArray(stepOutput)) {
    if (combineArray) {
      return handleCombinedArrayStepOutput(
        stepOutput,
        propertyPath,
        displayName,
        insertable
      );
    } else {
      return handlingArrayStepOutput(
        stepOutput,
        propertyPath,
        displayName,
        insertable,
      );
    }
  }
  const isObject = stepOutput && typeof stepOutput === 'object';
  if (isObject) {
    return handleObjectStepOutput(
      propertyPath,
      displayName,
      stepOutput,
      insertable,
      combineArray
    );
  }
  return {
    key: propertyPath,
    data: {
      propertyPath,
      displayName,
      insertable,
      value: stepOutput,
    },
    children: undefined,
  };
}

function handlingArrayStepOutput(
  stepOutput: unknown[],
  path: string,
  parentDisplayName: string,
  insertable: boolean,
  startingIndex = 0,
): MentionTreeNode {
  const maxSliceLength = 100;
  const isEmptyList = Object.keys(stepOutput).length === 0;
  if (stepOutput.length <= maxSliceLength) {
    return {
      key: parentDisplayName,
      children: stepOutput.map((output, idx) =>
        traverseStepOutputAndReturnMentionTree({
          stepOutput: output,
          propertyPath: `${path}[${idx + startingIndex}]`,
          displayName: `${parentDisplayName} [${idx + startingIndex + 1}]`,
        }),
      ),
      data: {
        propertyPath: path,
        displayName: parentDisplayName,
        value: isEmptyList ? 'Empty List' : undefined,
        insertable,
      },
    };
  }

  const numberOfSlices = new Array(
    Math.ceil(stepOutput.length / maxSliceLength),
  ).fill(0);
  const children: MentionTreeNode[] = numberOfSlices.map((_, idx) => {
    const startingIndex = idx * maxSliceLength;
    const endingIndex =
      Math.min((idx + 1) * maxSliceLength, stepOutput.length) - 1;
    const displayName = `${parentDisplayName} ${startingIndex}-${endingIndex}`;
    const sliceOutput = handlingArrayStepOutput(
      stepOutput.slice(startingIndex, endingIndex),
      path,
      parentDisplayName,
      insertable,
      startingIndex,
    );
    return {
      ...sliceOutput,
      key: displayName,
      data: {
        ...sliceOutput.data,
        displayName,
        isSlice: true,
      },
    };
  });

  return {
    key: parentDisplayName,
    data: {
      propertyPath: path,
      displayName: parentDisplayName,
      value: stepOutput,
      isSlice: false,
      insertable,
    },
    children: children,
  };
}

function handleObjectStepOutput(
  propertyPath: string,
  displayName: string,
  stepOutput: object,
  insertable: boolean,
  combineArray: boolean
): MentionTreeNode {
  const isEmptyList = Object.keys(stepOutput).length === 0;
  return {
    key: propertyPath,
    data: {
      propertyPath: propertyPath,
      displayName: displayName,
      value: isEmptyList ? 'Empty List' : undefined,
      insertable,
    },
    children: Object.keys(stepOutput).map((childPropertyKey) => {
      const escapedKey = childPropertyKey.replaceAll(
        /[\\"'\n\r\t’]/g,
        (char) => `\\${char}`,
      );
      return traverseStepOutputAndReturnMentionTree({
        stepOutput: (stepOutput as Record<string, unknown>)[childPropertyKey],
        propertyPath: `${propertyPath}['${escapedKey}']`,
        displayName: childPropertyKey,
        combineArray
      });
    }),
  };
}

export const dataSelectorUtils = {
  traverseStepOutputAndReturnMentionTree,
};
