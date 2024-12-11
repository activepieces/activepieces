import { useEffect, useState } from 'react';
import { Value } from '@sinclair/typebox/value';
import { AddActionRequest, FlowOperationType, flowStructureUtil, PieceTriggerSettings, StepLocationRelativeToParent, StepSettings, UpdateTriggerRequest } from '@activepieces/shared';
import { ContextMenuItem } from '@/components/ui/context-menu';
import { t } from 'i18next';
import { ClipboardPaste } from 'lucide-react';
import { ApButtonData } from '../types';
import { BuilderState } from '../../builder-hooks';
import { toast, UNSAVED_CHANGES_TOAST } from '@/components/ui/use-toast';
import { EMPTY_STEP_PARENT_NAME } from '../consts';

const getOperationsInClipboard = async () => {
    try {
        return JSON.parse(await navigator.clipboard.readText()) as AddActionRequest[];
    } catch (error) {
        return [];
    }
};

const clearSampleDataFileId = (settings: AddActionRequest['action']['settings']) => {
    const newSettings = JSON.parse(JSON.stringify(settings)) as AddActionRequest['action']['settings'];
    delete newSettings.inputUiInfo?.sampleDataFileId;
    return newSettings;
};

const replaceOldStepNamesAndMarkMissingSteps = (actionSettings: string, newStepsNamesMap: Record<string, string>): string => {
    const regex = new RegExp(`({{\\s*)step_(\\d+)(\\s*(?:[.\\[].*?)?\\s*}})`, 'g');
    const allStepsInSettings = [...actionSettings.matchAll(regex)];
    debugger;
    return allStepsInSettings.reduce((acc, regexMatch)=>{
        const stepName = `step_${regexMatch[2]}`;
        const stepNameRegex = new RegExp(`({{\\s*)${stepName}(\\s*(?:[.\\[].*?)?\\s*}})`, 'g');
        if(newStepsNamesMap[stepName]) {
            return acc.replaceAll(stepNameRegex, `$1${newStepsNamesMap[stepName]}$2`);
        }
        return acc.replaceAll(stepNameRegex, `$1step_999$2`);
    }, actionSettings);
};

const modifyAddRequestsActionsNames = (opeartions: AddActionRequest[], flowVersion: BuilderState['flowVersion'])=>{
    const allStepsNames = flowStructureUtil.getAllSteps(flowVersion.trigger).map(step => step.name);
    const newStepsNamesMap= opeartions.reduce((acc, operation)=>{
        const unsusedName = flowStructureUtil.findUnusedName(allStepsNames);
        allStepsNames.push(unsusedName);
        acc[operation.action.name] = unsusedName;
        return acc;
    }, {} as Record<string, string>);

    return opeartions.map(operation=>{
        const actionSettings = clearSampleDataFileId(operation.action.settings);
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


}


const AddButtonsContextMenuContent = ({addButtonData,applyOperation, flowVersion}: {addButtonData: ApButtonData, flowVersion: BuilderState['flowVersion'], applyOperation: BuilderState['applyOperation']}) => {
    const [operations, setOperations] = useState<AddActionRequest[]>([]);
    useEffect(() => {
        const fetchClipboardOperations = async () => {
            const fetchedOperations = await getOperationsInClipboard();
            if(fetchedOperations.length > 0 && fetchedOperations.every(operation => Value.Check(AddActionRequest, operation)))
            {
                setOperations(fetchedOperations);
            }
            else {
                setOperations([]);
            }
        };
        fetchClipboardOperations();
    }, []);
    const pasteOperations = () =>{
        const operationsToAddNewSteps = modifyAddRequestsActionsNames(operations, flowVersion);
        operationsToAddNewSteps.map(request=>{
           if(request.parentStep !== EMPTY_STEP_PARENT_NAME)
           {
            return request;
           }
           return {
            ...request,
            parentStep: addButtonData.parentStepName,
            branchIndex: addButtonData.stepLocationRelativeToParent === StepLocationRelativeToParent.INSIDE_BRANCH? addButtonData.branchIndex : undefined,
            stepLocationRelativeToParent: addButtonData.stepLocationRelativeToParent,
           }
        }).forEach(request=>{
            applyOperation({
                type: FlowOperationType.ADD_ACTION,
                request
            },()=>{
                toast(UNSAVED_CHANGES_TOAST)
            })
        },)
    }
    
    return (
            <ContextMenuItem disabled={operations.length <= 0}>
            <div className="flex gap-2 items-center" onClick={pasteOperations}>
                <ClipboardPaste className="w-4 h-4"></ClipboardPaste> {t('Paste')}
            </div>
            </ContextMenuItem>

    );
};

export default AddButtonsContextMenuContent;
