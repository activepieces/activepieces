import React from 'react';

import { ApMarkdown } from '@/components/custom/markdown';
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

const LoopsSettings = React.memo(
  ({ selectedStep, onUpdateAction }: LoopsSettingsProps) => {
    const loopOnItemsSettings = selectedStep.settings;

    return (
      <div className="grid gap-3">
        <Label htmlFor="email">Items</Label>
        <ApMarkdown markdown={markdown} />
        <Input
          type="text"
          placeholder="Select an array of items"
          onChange={(e) =>
            onUpdateAction(
              flowVersionUtils.buildActionWithNewLoopItems(
                selectedStep,
                e.target.value,
              ),
            )
          }
          value={loopOnItemsSettings.items}
        ></Input>
      </div>
    );
  },
);

LoopsSettings.displayName = 'LoopsSettings';
export { LoopsSettings };
