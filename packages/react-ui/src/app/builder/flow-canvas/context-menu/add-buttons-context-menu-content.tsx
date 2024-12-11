import { useEffect, useState } from 'react';
import { Value } from '@sinclair/typebox/value';
import { AddActionRequest, FlowOperationType, flowStructureUtil, StepLocationRelativeToParent } from '@activepieces/shared';
import { ContextMenuItem } from '@/components/ui/context-menu';
import { t } from 'i18next';
import { ClipboardPaste } from 'lucide-react';
import { ApButtonData } from '../types';
import { BuilderState } from '../../builder-hooks';
import { toast, UNSAVED_CHANGES_TOAST } from '@/components/ui/use-toast';

const getOperationsInClipboard = async () => {
    try {
        return JSON.parse(await navigator.clipboard.readText()) as AddActionRequest[];
    } catch (error) {
        return [];
    }
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
        return {
            ...operation,
            action: {
                ...operation.action,
                name: newStepsNamesMap[operation.action.name]
            },
            parentStep: newStepsNamesMap[operation.parentStep] ||'',
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
           if(request.parentStep !== '')
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
