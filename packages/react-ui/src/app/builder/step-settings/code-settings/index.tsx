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
import { AskAiButton } from '../ask-ai';

import { CodeEditor } from './code-editor';

const markdown = `
To use data from previous steps in your code, include them as pairs of keys and values below. 

You can access these inputs in your code using \`inputs.key\`, where \`key\` is the name you assigned below.  
`;

const warningMarkdown = `
**const code** is the entry to the code. If it is removed or renamed, your step will fail.
`;

type CodeSettingsProps = {
  readonly: boolean;
};

const CodeSettings = React.memo(({ readonly }: CodeSettingsProps) => {
  const form = useFormContext<CodeAction>();
  const [selectedStep, refreshStepFormSettingsToggle] = useBuilderStateContext(
    (state) => [state.selectedStep || '', state.refreshStepFormSettingsToggle],
  );
  const isCopilotEnabled = platformHooks.isCopilotEnabled();
  return (
    <div className="flex flex-col gap-4">
      <FormField
        control={form.control}
        name="settings.input"
        render={({ field }) => (
          <FormItem>
            <div className="pb-4">
              <ApMarkdown markdown={markdown} variant={MarkdownVariant.INFO} />
            </div>
            <div className="flex items-center justify-between !mb-2">
              <FormLabel>{t('Inputs')}</FormLabel>
              {isCopilotEnabled && !readonly && (
                <AskAiButton
                  onClick={() => {}}
                  varitant={'ghost'}
                  operation={{
                    type: FlowOperationType.UPDATE_ACTION,
                    stepName: selectedStep,
                  }}
                ></AskAiButton>
              )}
            </div>

            <DictionaryProperty
              disabled={readonly}
              values={field.value}
              onChange={field.onChange}
              useMentionTextInput={true}
            ></DictionaryProperty>
            <FormMessage />
          </FormItem>
        )}
      />

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
