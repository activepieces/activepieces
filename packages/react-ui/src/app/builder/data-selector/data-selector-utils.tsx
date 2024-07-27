import { FlowVersion, flowHelper, isNil } from "../../../../../shared/src";

export type DataSelectorNodeContent = {
  jsonPath: string;
  depth: number;
  label: React.ReactNode
  isTestStepNode?: boolean;
  children?: DataSelectorNodeContent[];
}

export const dataSelectorUtils = {
  getNodes(flowVersion: FlowVersion): DataSelectorNodeContent[] {
    const steps = flowHelper.getAllSteps(flowVersion.trigger); // TODO find steps until this step.
    return steps.map((step, index) => {
      const sampleData = step.settings?.inputUiInfo?.currentSelectedData;
      const hasSampleData = sampleData !== undefined;
      return {
        jsonPath: step.name,
        depth: 0,
        label: <>
          {index} {step.displayName}
        </>,
        isTestStepNode: !hasSampleData,
        children: hasSampleData ? traverseSampleData(sampleData, [step.name]) : undefined,
      }
    })
  }
}

// TODO 
/*
function traverseSampleData(sampleData: unknown, path: string[]): DataSelectorNodeContent[] {
  
  const children: DataSelectorNodeContent[] = [];
  Object.keys(sampleData).forEach((key) => {
    const value = sampleData[key];
    const newPath = [...path, key];
    if (typeof value === 'object') {
      children.push(...traverseSampleData(value, newPath));
    }
    else {
      children.push({
        jsonPath: newPath.join('.'),
        depth: newPath.length,
        label: newPath.join('.'),
      });
    }
  });
  return children;
}*/