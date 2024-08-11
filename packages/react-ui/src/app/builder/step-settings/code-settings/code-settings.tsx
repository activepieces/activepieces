import { CodeAction } from '@activepieces/shared';
import { Bot } from 'lucide-react';
import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import { LeftSideBarType, useBuilderStateContext } from '../../builder-hooks';
import { DictionaryProperty } from '../../piece-properties/dictionary-property';

import { CodeEditior } from './code-editior';

import { ApMarkdown } from '@/components/custom/markdown';
import { Button } from '@/components/ui/button';
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const markdown = `
To use data from previous steps in your code, include them as pairs of keys and values below.

You can access these inputs in your code using \`inputs.key\`, where \`key\` is the name you assigned below.

**Warning: "const code" is the entry to the code, if it is removed or renamed, your step will fail.**
`;

type CodeSettingsProps = {
  readonly: boolean;
};

const CodeSettings = React.memo(({ readonly }: CodeSettingsProps) => {
  const form = useFormContext<CodeAction>();
  const [setLeftSidebar] = useBuilderStateContext((state) => [
    state.setLeftSidebar,
  ]);

  useEffect(() => {
    return () => setLeftSidebar(LeftSideBarType.NONE);
  }, [setLeftSidebar]);

  return (
    <div className="flex flex-col gap-4">
      <FormField
        control={form.control}
        name="settings.input"
        render={({ field }) => (
          <FormItem>
            <div className="flex align-center justify-between">
              <FormLabel className="pt-4">Inputs</FormLabel>
              <Button
                variant="ghost"
                onClick={() => setLeftSidebar(LeftSideBarType.AI_COPILOT)}
                className="flex items-right max-w-max"
              >
                <Bot />
                <span className="ml-2"> Ask AI </span>
              </Button>
            </div>
            <ApMarkdown markdown={markdown} />
            <DictionaryProperty
              disabled={readonly}
              values={field.value}
              onChange={field.onChange}
            ></DictionaryProperty>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="settings.sourceCode"
        render={({ field }) => (
          <FormItem>
            <CodeEditior
              sourceCode={field.value}
              onChange={field.onChange}
              readonly={readonly}
            ></CodeEditior>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
});
CodeSettings.displayName = 'CodeSettings';
export { CodeSettings };
