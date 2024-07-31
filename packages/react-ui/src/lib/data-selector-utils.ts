export type MentionTreeNode = {
  key: string;
  data: {
    propertyPath: string;
    /**Key for json value */
    displayName: string;
    /**value for json key */
    value?: string | unknown;
    isSlice: boolean;
    isTestStepNode?: boolean;
  };
  children?: MentionTreeNode[];
};

type HandleStepOutputProps = {
  stepOutput: unknown;
  propertyPath: string;
  displayName: string;
};

/**Traverses an object to find its child properties and their paths, stepOutput has to be an object on first invocation */
function traverseStepOutputAndReturnMentionTree({
  stepOutput,
  propertyPath,
  displayName,
}: HandleStepOutputProps): MentionTreeNode {
  if (Array.isArray(stepOutput)) {
    return handlingArrayStepOutput({
      stepOutput,
      lastDisplayName: displayName,
      path: propertyPath,
      startingIndex: 0,
    });
  }
  const isObject = stepOutput && typeof stepOutput === 'object';

  if (isObject) {
    return handleObjectStepOutput({ propertyPath, displayName, stepOutput });
  }

  return {
    key: propertyPath,
    data: {
      propertyPath,
      displayName,
      value: formatStepOutput(stepOutput),
      isSlice: false,
    },
    children: undefined,
  };
}

const handlingArrayStepOutput = ({
  lastDisplayName,
  startingIndex,
  stepOutput,
  path,
}: {
  stepOutput: unknown[];
  path: string;
  lastDisplayName: string;
  startingIndex: number;
}): MentionTreeNode => {
  const MAX_ARRAY_LENGTH_BEFORE_SLICING = 100;
  if (stepOutput.length <= MAX_ARRAY_LENGTH_BEFORE_SLICING) {
    return {
      key: lastDisplayName,
      children: stepOutput.map((ouput, idx) => {
        return traverseStepOutputAndReturnMentionTree({
          stepOutput: ouput,
          propertyPath: `${path}[${idx + startingIndex}]`,
          displayName: `${lastDisplayName} ${idx + startingIndex}`,
        });
      }),
      data: {
        propertyPath: path,
        displayName: lastDisplayName,
        value: stepOutput.length === 0 ? 'Empty List' : undefined,
        isSlice: false,
      },
    };
  }

  const numberOfSlices = new Array(
    Math.ceil(stepOutput.length / MAX_ARRAY_LENGTH_BEFORE_SLICING),
  ).fill(0);
  const children: MentionTreeNode[] = [];
  numberOfSlices.forEach((_, idx) => {
    const startingIndex = idx * MAX_ARRAY_LENGTH_BEFORE_SLICING;
    const endingIndex =
      Math.min((idx + 1) * MAX_ARRAY_LENGTH_BEFORE_SLICING, stepOutput.length) -
      1;
    const displayName = `${lastDisplayName} ${startingIndex}-${endingIndex}`;
    const sliceOutput = handlingArrayStepOutput({
      stepOutput: stepOutput.slice(startingIndex, endingIndex),
      path,
      lastDisplayName,
      startingIndex,
    });
    children.push({
      ...sliceOutput,
      key: displayName,
      data: {
        ...sliceOutput.data,
        displayName,
        isSlice: true,
      },
    });
  });
  return {
    key: lastDisplayName,
    data: {
      propertyPath: path,
      displayName: lastDisplayName,
      value: stepOutput,
      isSlice: false,
    },
    children: children,
  };
};

function handleObjectStepOutput({
  displayName,
  propertyPath,
  stepOutput,
}: {
  propertyPath: string;
  displayName: string;
  stepOutput: object;
}): MentionTreeNode {
  return {
    key: propertyPath,
    data: {
      propertyPath: propertyPath,
      displayName: displayName,
      isSlice: false,
      value: Object.keys(stepOutput).length === 0 ? 'Empty List' : undefined,
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
      });
    }),
  };
}

function formatStepOutput(stepOutput: unknown) {
  if (stepOutput === null) {
    return 'null';
  }

  if (typeof stepOutput === 'string') {
    return `"${stepOutput}"`;
  }

  return stepOutput;
}

export const dataSelectorUtils = {
  formatStepOutput,
  traverseStepOutputAndReturnMentionTree,
  handlingArrayStepOutput,
};
