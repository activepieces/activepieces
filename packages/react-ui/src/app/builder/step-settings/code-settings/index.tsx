import { t } from 'i18next';
import React from 'react';
import { useFormContext } from 'react-hook-form';

import { ApMarkdown } from '@/components/custom/markdown';
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { platformHooks } from '@/hooks/platform-hooks';
import {
  CodeAction,
  FlowOperationType,
  MarkdownVariant,
} from '@activepieces/shared';

import { useBuilderStateContext } from '../../builder-hooks';
import { DictionaryProperty } from '../../piece-properties/dictionary-property';
import { AskAiButton } from '../../pieces-selector/ask-ai';

import { CodeEditor } from './code-editor';
import { CodePropsInputForm } from './code-props-input';



const warningMarkdown = `
**const code** is the entry to the code. If it is removed or renamed, your step will fail.
`;

type CodeSettingsProps = {
  readonly: boolean;
};

const CodeSettings = React.memo(({ readonly }: CodeSettingsProps) => {
  const form = useFormContext<CodeAction>();
  const [refreshStepFormSettingsToggle, flowId] = useBuilderStateContext(
    (state) => [state.refreshStepFormSettingsToggle, state.flow.id],
  );
  return (
    <div className="flex flex-col gap-4">
      <CodePropsInputForm readonly={readonly} flowId={flowId} />

      <div>
        <ApMarkdown
          markdown={warningMarkdown}
          variant={MarkdownVariant.WARNING}
        />
      </div>
      <FormField
        control={form.control}
        name="settings.sourceCode"
        render={({ field }) => (
          <FormItem>
            <CodeEditor
              animateBorderColorToggle={refreshStepFormSettingsToggle}
              sourceCode={field.value}
              onChange={field.onChange}
              readonly={readonly}
            ></CodeEditor>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
});
CodeSettings.displayName = 'CodeSettings';
export { CodeSettings };
