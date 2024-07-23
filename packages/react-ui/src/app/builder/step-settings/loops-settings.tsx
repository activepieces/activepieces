import { LoopOnItemsAction, debounce } from '@activepieces/shared';
import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import React from 'react';
import { useForm } from 'react-hook-form';

import { TextInputWithMentions } from '../flow-canvas/text-input-with-mentions';

import { ApMarkdown } from '@/components/custom/markdown';
import { FormField, FormItem, FormMessage, Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { flowVersionUtils } from '@/features/flows/lib/flow-version-util';
import { LoopOnItemsAction } from '@activepieces/shared';


type LoopsSettingsProps = {
  selectedStep: LoopOnItemsAction;
  onUpdateAction: (value: LoopOnItemsAction) => void;
};

const markdown = `
Select the items to iterate over from the previous step by clicking on the **Items** input, which should be a **list** of items.

The loop will iterate over each item in the list and execute the next step for every item.
`;

const FormSchema = Type.Object({
  items: Type.String({
    minLength: 1,
    errorMessage: 'Please select items to iterate over',
  }),
});

type FormSchema = Static<typeof FormSchema>;

const LoopsSettings = React.memo(
  ({ selectedStep, onUpdateAction }: LoopsSettingsProps) => {
    const loopOnItemsSettings = selectedStep.settings;

    const form = useForm<FormSchema>({
      defaultValues: {
        items: loopOnItemsSettings.items,
      },
      resolver: typeboxResolver(FormSchema),
    });

    const updateFormChange = async () => {
      await form.trigger();
      const newAction = flowVersionUtils.buildActionWithNewLoopItems(
        selectedStep,
        form.getValues().items,
        form.formState.isValid,
      );
      onUpdateAction(newAction);
    };

    return (
      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()}>
          <FormField
            control={form.control}
            name="items"
            render={({ field }) => (
              <FormItem>
                <Label htmlFor="email">Items</Label>
                <ApMarkdown markdown={markdown} />
                <TextInputWithMentions
                  onChange={(e) => {
                    field.onChange(e);
                    updateFormChange();
                  }}
                  originalValue={field.value}
                  placeholder="Select an array of items"
                ></TextInputWithMentions>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    );
  },
);

LoopsSettings.displayName = 'LoopsSettings';
export { LoopsSettings };
