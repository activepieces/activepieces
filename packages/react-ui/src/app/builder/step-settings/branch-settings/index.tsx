import { t } from 'i18next';
import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';

import { BranchConditionGroup } from '@/app/builder/step-settings/branch-settings/branch-condition-group';
import { emptyCondition, PropertyExecutionType } from '@activepieces/shared';
import { ButtonWithTooltip } from '@/components/custom/button-with-tooltip';
import { propertyUtils } from '../../piece-properties/property-utils';
import { Sparkles } from 'lucide-react';

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
        <div className="text-md justify-between flex items-center">
          <span>{t('Execute If')}</span>
          <ButtonWithTooltip
            tooltip={
              t('Auto Fill by AI')
            }
            onClick={()=>{}}
            icon={
              <Sparkles className="h-4 w-4" />
            }
          />
        </div>
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
