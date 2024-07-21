import React from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { ApMarkdown } from '@/components/custom/markdown';
import { DictionaryInput } from '@/components/ui/dictionary-input';
import { UNSAVED_CHANGES_TOAST, useToast } from '@/components/ui/use-toast';
import { flowVersionUtils } from '@/features/flows/lib/flow-version-util';
import { CodeEditior } from '@/features/properties-form/components/code-editior';
import {
  CodeAction,
  CodeActionSettings,
  FlowOperationType,
} from '@activepieces/shared';

const markdown = `
To use data from previous steps in your code, include them as pairs of keys and values below.

You can access these inputs in your code using \`inputs.key\`, where \`key\` is the name you assigned below.

**Warning: "const code" is the entry to the code, if it is removed or renamed, your step will fail.**
`;

type CodeSettingsProps = {
  selectedStep: CodeAction;
};

const CodeSettings = React.memo(({ selectedStep }: CodeSettingsProps) => {
  const codeSettings = selectedStep.settings as CodeActionSettings;
  const { toast } = useToast();

  const [readonly, applyOperation] = useBuilderStateContext((state) => [
    state.readonly,
    state.applyOperation,
  ]);

  function handleCodeChange(
    code: string | undefined,
    input: Record<string, string> | undefined,
  ) {
    const newAction = flowVersionUtils.buildActionWithNewCode(
      selectedStep,
      code ?? codeSettings.sourceCode.code,
      input ?? codeSettings.input,
    );
    applyOperation(
      {
        type: FlowOperationType.UPDATE_ACTION,
        request: newAction,
      },
      () => toast(UNSAVED_CHANGES_TOAST),
    );
  }
  return (
    <>
      <div className="text-md">Inputs</div>
      <ApMarkdown markdown={markdown}></ApMarkdown>
      <DictionaryInput
        values={codeSettings.input}
        onChange={(inputs) => handleCodeChange(undefined, inputs)}
      ></DictionaryInput>
      <CodeEditior
        code={codeSettings.sourceCode.code}
        onChange={(code) => handleCodeChange(code, undefined)}
        readonly={readonly}
        language="typescript"
      ></CodeEditior>
    </>
  );
});
CodeSettings.displayName = 'CodeSettings';
export { CodeSettings };
