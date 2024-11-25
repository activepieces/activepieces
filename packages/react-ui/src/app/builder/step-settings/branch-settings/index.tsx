import { t } from 'i18next';
import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';

import { BranchConditionGroup } from '@/app/builder/step-settings/branch-settings/branch-condition-group';
import { emptyCondition } from '@activepieces/shared';

type BranchSettingsProps = {
  readonly: boolean;
  branchIndex: number;
};

const BranchSettings = React.memo(
  ({ readonly, branchIndex }: BranchSettingsProps) => {
    const form = useFormContext();
    const { fields, append, remove, update } = useFieldArray({
      control: form.control,
      name: `settings.branches.${branchIndex}.conditions`,
    });

    const handleDelete = (groupIndex: number, conditionIndex: number) => {
      const conditions = form.getValues(
        `settings.branches.${branchIndex}.conditions`,
      );
      const newConditionsGroup = [...conditions[groupIndex]];
      const isSingleGroup = conditions.length === 1;
      const isSingleConditionInGroup = newConditionsGroup.length === 1;

      if (isSingleGroup && isSingleConditionInGroup) {
        update(groupIndex, [emptyCondition]);
      } else if (isSingleConditionInGroup) {
        remove(groupIndex);
      } else {
        newConditionsGroup.splice(conditionIndex, 1);
        update(groupIndex, newConditionsGroup);
      }
    };

    const handleAnd = (groupIndex: number) => {
      const conditions = form.getValues(
        `settings.branches.${branchIndex}.conditions`,
      );
      conditions[groupIndex] = [...conditions[groupIndex], emptyCondition];
      update(groupIndex, conditions[groupIndex]);
    };

    const handleOr = () => {
      append([[emptyCondition]]);
    };

    return (
      <div className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
        <div className="text-md ">{t('Execute If')}</div>
        {fields.map((fieldGroup, groupIndex) => (
          <BranchConditionGroup
            key={fieldGroup.id}
            readonly={readonly}
            branchIndex={branchIndex}
            numberOfGroups={fields.length}
            groupIndex={groupIndex}
            onAnd={() => handleAnd(groupIndex)}
            onOr={handleOr}
            handleDelete={(conditionIndex: number) =>
              handleDelete(groupIndex, conditionIndex)
            }
          />
        ))}
      </div>
    );
  },
);

BranchSettings.displayName = 'BranchSettings';
export { BranchSettings };
