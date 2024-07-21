import React from 'react';

import { ApMarkdown } from '@/components/custom/markdown';
import { DictionaryInput } from '@/components/ui/dictionary-input';
import { flowVersionUtils } from '@/features/flows/lib/flow-version-util';
import { CodeEditior } from '@/features/properties-form/components/code-editior';
import { CodeAction, CodeActionSettings } from '@activepieces/shared';

const markdown = `
To use data from previous steps in your code, include them as pairs of keys and values below.

You can access these inputs in your code using \`inputs.key\`, where \`key\` is the name you assigned below.

**Warning: "const code" is the entry to the code, if it is removed or renamed, your step will fail.**
`;

type CodeSettingsProps = {
  selectedStep: CodeAction;
  readonly: boolean;
  onUpdateAction: (value: CodeAction) => void;
};

const CodeSettings = React.memo(
  ({ selectedStep, readonly, onUpdateAction }: CodeSettingsProps) => {
    const codeSettings = selectedStep.settings as CodeActionSettings;

    function handleCodeChange(
      code: string | undefined,
      input: Record<string, string> | undefined,
    ) {
      const newAction = flowVersionUtils.buildActionWithNewCode(
        selectedStep,
        code ?? codeSettings.sourceCode.code,
        input ?? codeSettings.input,
      );
      onUpdateAction(newAction);
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
  },
);
CodeSettings.displayName = 'CodeSettings';
export { CodeSettings };
