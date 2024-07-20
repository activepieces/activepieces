import { ApMarkdown } from "@/components/custom/markdown"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { flowVersionUtils } from "@/features/flows/lib/flow-version-util"
import { useBuilderStateContext } from "@/hooks/builder-hooks"
import { FlowOperationType, LoopOnItemsAction } from "@activepieces/shared"
import React from "react"


type LoopsSettingsProps = {
    selectedStep: LoopOnItemsAction
}

const markdown = `
Select the items to iterate over from the previous step by clicking on the **Items** input, which should be a **list** of items.

The loop will iterate over each item in the list and execute the next step for every item.
`;

const LoopsSettings = React.memo(({ selectedStep }: LoopsSettingsProps) => {

    const loopOnItemsSettings = selectedStep.settings;
    const applyOperation = useBuilderStateContext((state) => state.applyOperation);

    function handleItemsChange(items: string) {
        const newAction = flowVersionUtils.buildActionWithNewLoopItems(selectedStep, items);
        applyOperation({
            type: FlowOperationType.UPDATE_ACTION,
            request: newAction,
        })
    }

    return <div className="grid gap-3">
        <Label htmlFor="email">Items</Label>
        <ApMarkdown markdown={markdown} />
        <Input type="text" placeholder="Select an array of items" onChange={(e) => handleItemsChange(e.target.value)} value={loopOnItemsSettings.items}></Input>
    </div>
})

export { LoopsSettings }