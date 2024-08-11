import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import { ApMarkdown } from '@/components/custom/markdown';
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { CodeAction } from '@activepieces/shared';

import { DictionaryProperty } from '../../piece-properties/dictionary-property';

import { CodeEditior } from './code-editior';
import { Tooltip, TooltipContent } from '@/components/ui/tooltip';
import { TooltipTrigger } from '@radix-ui/react-tooltip';
import { Button } from '@/components/ui/button';
import { LeftSideBarType, useBuilderStateContext } from '../../builder-hooks';
import { Bot } from 'lucide-react';

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
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={() => setLeftSidebar(LeftSideBarType.AI_COPILOT)}>
            <Bot />
            <span className="ml-2"> Ask AI </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Use AI to generate code.</TooltipContent>
      </Tooltip>

      <div className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="settings.input"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Inputs</FormLabel>
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
    </>
  );
});
CodeSettings.displayName = 'CodeSettings';
export { CodeSettings };
