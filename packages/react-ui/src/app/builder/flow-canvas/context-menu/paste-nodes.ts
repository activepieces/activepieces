import { AddActionRequest, FlowOperationType, StepLocationRelativeToParent, flowStructureUtil } from '@activepieces/shared';
import { BuilderState } from '../../builder-hooks';
import { ApButtonData } from '../types';
import { EMPTY_STEP_PARENT_NAME } from '../consts';
import { toast, UNSAVED_CHANGES_TOAST } from '@/components/ui/use-toast';


export const getOperationsInClipboard = async () => {
  try {
      return JSON.parse(await navigator.clipboard.readText()) as AddActionRequest[];
  } catch (error) {
      return [];
  }
};

const clearSampleDataInfo = (settings: AddActionRequest['action']['settings']) => {
    const newSettings = JSON.parse(JSON.stringify(settings)) as AddActionRequest['action']['settings'];
    delete newSettings.inputUiInfo?.sampleDataFileId;
    delete newSettings.inputUiInfo?.lastTestDate;
    return newSettings;
};

const replaceOldStepNamesAndMarkMissingSteps = (actionSettings: string, newStepsNamesMap: Record<string, string>): string => {
    const regex = new RegExp(`({{\\s*)step_(\\d+)(\\s*(?:[.\\[].*?)?\\s*}})`, 'g');
    const allStepsInSettings = [...actionSettings.matchAll(regex)];
    return allStepsInSettings.reduce((acc, regexMatch)=>{
        const stepName = `step_${regexMatch[2]}`;
        const stepNameRegex = new RegExp(`({{\\s*)${stepName}(\\s*(?:[.\\[].*?)?\\s*}})`, 'g');
        if(newStepsNamesMap[stepName]) {
            return acc.replaceAll(stepNameRegex, `$1${newStepsNamesMap[stepName]}$2`);
        }
        return acc.replaceAll(stepNameRegex, `$1step_999$2`);
    }, actionSettings);
};

const modifyAddRequestsActionsNames = (operations: AddActionRequest[], flowVersion: BuilderState['flowVersion']) => {
    const allStepsNames = flowStructureUtil.getAllSteps(flowVersion.trigger).map(step => step.name);
    const newStepsNamesMap = operations.reduce((acc, operation)=>{
        const unsusedName = flowStructureUtil.findUnusedName(allStepsNames);
        allStepsNames.push(unsusedName);
        acc[operation.action.name] = unsusedName;
        return acc;
    }, {} as Record<string, string>);

    return operations.map(operation=>{
        const actionSettings = clearSampleDataInfo(operation.action.settings);
        const settingsWithNewStepNames = replaceOldStepNamesAndMarkMissingSteps(JSON.stringify(actionSettings), newStepsNamesMap);

        return {
            ...operation,
            action: {
                ...operation.action,
                name: newStepsNamesMap[operation.action.name],
                settings: JSON.parse(settingsWithNewStepNames)
            },
            parentStep: newStepsNamesMap[operation.parentStep] || EMPTY_STEP_PARENT_NAME,
        }
    }) as AddActionRequest[]
};

export const pasteNodes = (
  operations: AddActionRequest[],
  flowVersion: BuilderState['flowVersion'],
  addButtonData: ApButtonData,
  applyOperation: BuilderState['applyOperation']
) => {
  const operationsToAddNewSteps = modifyAddRequestsActionsNames(operations, flowVersion);
  operationsToAddNewSteps
    .map(request => {
      if (request.parentStep !== EMPTY_STEP_PARENT_NAME) {
        return request;
      }
      return {
        ...request,
        parentStep: addButtonData.parentStepName,
        branchIndex:
          addButtonData.stepLocationRelativeToParent === StepLocationRelativeToParent.INSIDE_BRANCH
            ? addButtonData.branchIndex
            : undefined,
        stepLocationRelativeToParent: addButtonData.stepLocationRelativeToParent,
      };
    })
    .forEach(request => {
      applyOperation(
        {
          type: FlowOperationType.ADD_ACTION,
          request,
        },
        () => {
          toast(UNSAVED_CHANGES_TOAST);
        }
      );
    });
};