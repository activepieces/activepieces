import { ApMarkdown } from "@/components/custom/markdown"
import { DictionaryInput } from "@/components/ui/dictionary-input"
import { flowVersionUtils } from "@/features/flows/lib/flow-version-util";
import { CodeEditior } from "@/features/properties-form/components/code-editior";
import { useBuilderStateContext } from "@/hooks/builder-hooks";
import { CodeAction, CodeActionSettings, FlowOperationType } from "@activepieces/shared";
import React from "react";

const markdown = `
To use data from previous steps in your code, include them as pairs of keys and values below.

You can access these inputs in your code using \`inputs.key\`, where \`key\` is the name you assigned below.

**Warning: "const code" is the entry to the code, if it is removed or renamed, your step will fail.**
`;


type CodeSettingsProps = {
    selectedStep: CodeAction;
}

export const CodeSettings = React.memo(({ selectedStep }: CodeSettingsProps) => {

    const codeSettings = selectedStep.settings as CodeActionSettings;
    const applyOperation = useBuilderStateContext((state) => state.applyOperation);

    function handleCodeChange(code: string) {
        const newAction = flowVersionUtils.buildActionWithNewCode(selectedStep, code);
        applyOperation({
            type: FlowOperationType.UPDATE_ACTION,
            request: newAction,
        })
    }
    return <>
        <div className="text-md">
            Inputs
        </div>
        <ApMarkdown markdown={markdown}></ApMarkdown>
        <DictionaryInput values={[]} onChange={() => { }}></DictionaryInput>
        <CodeEditior code={codeSettings.sourceCode.code} onChange={handleCodeChange}></CodeEditior>
        
    </>
})