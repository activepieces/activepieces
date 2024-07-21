import React from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { ApMarkdown } from '@/components/custom/markdown';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UNSAVED_CHANGES_TOAST, useToast } from '@/components/ui/use-toast';
import { flowVersionUtils } from '@/features/flows/lib/flow-version-util';
import { FlowOperationType, LoopOnItemsAction } from '@activepieces/shared';

type LoopsSettingsProps = {
  selectedStep: LoopOnItemsAction;
};

const markdown = `
Select the items to iterate over from the previous step by clicking on the **Items** input, which should be a **list** of items.

The loop will iterate over each item in the list and execute the next step for every item.
`;

const LoopsSettings = React.memo(({ selectedStep }: LoopsSettingsProps) => {
  const loopOnItemsSettings = selectedStep.settings;
  const applyOperation = useBuilderStateContext(
    (state) => state.applyOperation,
  );
  const { toast } = useToast();

  function handleItemsChange(items: string) {
    const newAction = flowVersionUtils.buildActionWithNewLoopItems(
      selectedStep,
      items,
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
    <div className="grid gap-3">
      <Label htmlFor="email">Items</Label>
      <ApMarkdown markdown={markdown} />
      <Input
        type="text"
        placeholder="Select an array of items"
        onChange={(e) => handleItemsChange(e.target.value)}
        value={loopOnItemsSettings.items}
      ></Input>
    </div>
  );
});

LoopsSettings.displayName = 'LoopsSettings';
export { LoopsSettings };
