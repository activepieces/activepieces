import { useEffect, useState } from 'react';
import { Value } from '@sinclair/typebox/value';
import { AddActionRequest } from '@activepieces/shared';
import { ContextMenuItem } from '@/components/ui/context-menu';
import { t } from 'i18next';
import { ClipboardPaste } from 'lucide-react';
import { ApButtonData } from '../utils/types';
import { BuilderState } from '../../builder-hooks';
import { getOperationsInClipboard, pasteNodes } from '../bulk-actions/paste-nodes';



const AddButtonsContextMenuContent = ({addButtonData, applyOperation, flowVersion}: {addButtonData: ApButtonData, flowVersion: BuilderState['flowVersion'], applyOperation: BuilderState['applyOperation']}) => {
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

    const handlePaste = () => {
        pasteNodes(operations, flowVersion, addButtonData, applyOperation);
    };
    
    return (
            <ContextMenuItem disabled={operations.length <= 0}>
            <div className="flex gap-2 items-center" onClick={handlePaste}>
                <ClipboardPaste className="w-4 h-4"></ClipboardPaste> {t('Paste')}
            </div>
            </ContextMenuItem>
    );
};

export default AddButtonsContextMenuContent;
