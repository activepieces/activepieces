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
/**Traverses an object to find its child properties and their paths, stepOutput has to be an object on first invocation */
function traverseStepOutputAndReturnMentionTree({
  stepOutput,
  propertyPath,
  displayName,
}: {
  stepOutput: unknown;
  propertyPath: string;
  displayName: string;
}): MentionTreeNode {
  if (stepOutput && typeof stepOutput === 'object') {
    if (Array.isArray(stepOutput)) {
      return handlingArrayStepOutput(stepOutput, propertyPath, displayName);
    }
    return {
      key: propertyPath,
      data: {
        propertyPath: propertyPath,
        displayName: displayName,
        isSlice: false,
        value: Object.keys(stepOutput).length === 0 ? 'Empty List' : undefined,
      },
      children: Object.keys(stepOutput).map((k) => {
        const escapedKey = k
          .replaceAll(/\\/g, '\\')
          .replaceAll(/"/g, '\\"')
          .replaceAll(/'/g, "\\'")
          .replaceAll(/\n/g, '\\n')
          .replaceAll(/\r/g, '\\r')
          .replaceAll(/\t/g, '\\t')
          .replaceAll(/’/g, '\\’');
        const newPath = `${propertyPath}['${escapedKey}']`;
        const newDisplayName = k;
        return traverseStepOutputAndReturnMentionTree({
          stepOutput: (stepOutput as Record<string, unknown>)[k],
          propertyPath: newPath,
          displayName: newDisplayName,
        });
      }),
    };
  } else {
    const value = formatStepOutput(stepOutput);
    return {
      key: propertyPath,
      data: {
        propertyPath: propertyPath,
        displayName: displayName,
        value,
        isSlice: false,
      },
      children: undefined,
    };
  }
}

const handlingArrayStepOutput = (
  stepOutput: unknown[],
  path: string,
  lastDisplayName: string,
  startingIndex = 0,
): MentionTreeNode => {
  if (stepOutput.length <= MAX_ARRAY_LENGTH_BEFORE_SLICING) {
    return {
      key: lastDisplayName,
      children: stepOutput.map((v, idx) => {
        const newPath = `${path}[${idx + startingIndex}]`;
        const newDisplayName = `${lastDisplayName} ${idx + startingIndex}`;
        return traverseStepOutputAndReturnMentionTree({
          stepOutput: v,
          propertyPath: newPath,
          displayName: newDisplayName,
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

  const numberOfSlices = new Array(Math.ceil(stepOutput.length / 100)).fill(0);
  const children: MentionTreeNode[] = [];
  numberOfSlices.forEach((_, i) => {
    const startingIndex = i * 100;
    const endingIndex = Math.min((i + 1) * 100, stepOutput.length) - 1;
    const newPath = `${path}`;
    const displayName = `${lastDisplayName} ${startingIndex}-${endingIndex}`;
    const sliceOutput = handlingArrayStepOutput(
      stepOutput.slice(startingIndex, endingIndex),
      newPath,
      lastDisplayName,
      startingIndex,
    );
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

function formatStepOutput(stepOutput: unknown) {
  if (stepOutput === null) {
    return 'null';
  }

  if (typeof stepOutput === 'string') {
    return `"${stepOutput}"`;
  }

  return stepOutput;
}

const MAX_ARRAY_LENGTH_BEFORE_SLICING = 100;
const isStepName = (name: string) => {
  const regex = /^(trigger|step_\d+)$/;
  return regex.test(name);
};

const textWithMentionsClass = 'ap-text-with-mentions';
export const dataSelectorUtils = {
  isStepName,
  formatStepOutput,
  traverseStepOutputAndReturnMentionTree,
  handlingArrayStepOutput,
  textWithMentionsClass,
};
