import { Button } from "@/components/ui/button";
import { useBuilderStateContext, usePasteActionsInClipboard } from "../../builder-hooks";
import { ApButtonData } from "../utils/types";
import { ClipboardPaste } from "lucide-react";
import { pasteNodes } from "../bulk-actions";

// TODO: make the position of the paste button relative to the add button
export const PasteButton = ({ addButtonData }: { addButtonData: ApButtonData }) => {
    const pasteActionsInClipboard = usePasteActionsInClipboard();
    const [flowVersion, applyOperation] = useBuilderStateContext(state => [state.flowVersion, state.applyOperation])
    return <Button variant='transparent'
        size='icon'
        disabled={pasteActionsInClipboard.length === 0}
        onClick={() => {
            pasteNodes(
                pasteActionsInClipboard,
                flowVersion,
                addButtonData,
                applyOperation,
            );
        }}
        >
        <ClipboardPaste className="w-4 h-4 -scale-x-100" />
    </Button>
}