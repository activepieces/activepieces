import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import React, { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { ApMarkdown } from '@/components/custom/markdown';
import { DictionaryInput } from '@/components/ui/dictionary-input';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
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

const FormSchema = Type.Object({
  code: Type.String({
    minLength: 1,
    errorMessage: 'You need to write a code snippet',
  }),
  input: Type.Record(Type.String(), Type.String()),
});

type FormSchema = Static<typeof FormSchema>;

const CodeSettings = React.memo(
  ({ selectedStep, readonly, onUpdateAction }: CodeSettingsProps) => {
    const codeSettings = selectedStep.settings as CodeActionSettings;
    const form = useForm<FormSchema>({
      defaultValues: {
        code: codeSettings.sourceCode.code,
        input: codeSettings.input,
      },
      resolver: typeboxResolver(FormSchema),
    });

    const watchedForm = useWatch({ control: form.control });

    useEffect(() => {
      if (!form.formState.isDirty) {
        return;
      }
      updateFormChange();
    }, [watchedForm]);

    async function updateFormChange() {
      await form.trigger();
      const { code, input } = form.getValues();
      const newAction = flowVersionUtils.buildActionWithNewCode(
        selectedStep,
        code,
        input,
      );
      onUpdateAction(newAction);
    }

    return (
      <Form {...form}>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col gap-4"
        >
          <FormField
            control={form.control}
            name="input"
            render={({ field }) => (
              <FormItem>
                <Label>Inputs</Label>
                <ApMarkdown markdown={markdown} />
                <DictionaryInput
                  values={field.value}
                  onChange={field.onChange}
                ></DictionaryInput>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <CodeEditior
                  code={field.value}
                  onChange={field.onChange}
                  readonly={readonly}
                  language="typescript"
                ></CodeEditior>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    );
  },
);
CodeSettings.displayName = 'CodeSettings';
export { CodeSettings };
