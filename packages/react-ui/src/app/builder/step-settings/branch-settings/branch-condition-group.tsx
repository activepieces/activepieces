import { t } from 'i18next';
import React from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { BranchConditionToolbar } from '@/app/builder/step-settings/branch-settings/branch-condition-toolbar';
import { BranchSingleCondition } from '@/app/builder/step-settings/branch-settings/branch-single-condition';
import { HorizontalSeparatorWithText } from '@/components/ui/seperator';
import { BranchAction } from '@activepieces/shared';

type BranchConditionGroupProps = {
  readonly: boolean;
  groupIndex: number;
  onAnd: () => void;
  onOr: () => void;
  numberOfGroups: number;
  handleDelete: (conditionIndex: number) => void;
};

const BranchConditionGroup = React.memo(
  ({
    readonly,
    groupIndex,
    onAnd,
    onOr,
    handleDelete,
    numberOfGroups,
  }: BranchConditionGroupProps) => {
    const form = useFormContext<BranchAction>();
    const { fields } = useFieldArray({
      control: form.control,
      name: `settings.conditions.${groupIndex}`,
    });

    return (
      <div className="flex flex-col gap-4">
        {groupIndex > 0 && (
          <HorizontalSeparatorWithText className="my-2">
            {t('OR')}
          </HorizontalSeparatorWithText>
        )}
        {fields.length === 0 && (
          <BranchConditionToolbar
            readonly={readonly}
            key={`toolbar-${groupIndex}`}
            onAnd={onAnd}
            onOr={onOr}
            showOr={true}
            showAnd={true}
          />
        )}
        {fields.map((condition, conditionIndex) => (
          <React.Fragment key={condition.id}>
            {conditionIndex > 0 && <div>{t('And If')}</div>}
            <BranchSingleCondition
              groupIndex={groupIndex}
              readonly={readonly}
              conditionIndex={conditionIndex}
              deleteClick={() => handleDelete(conditionIndex)}
              showDelete={numberOfGroups !== 1 || fields.length !== 1}
            />
          </React.Fragment>
        ))}
        <BranchConditionToolbar
          onAnd={onAnd}
          onOr={onOr}
          readonly={readonly}
          showOr={true}
          showAnd={true}
        />
      </div>
    );
  },
);

BranchConditionGroup.displayName = 'ConditionGroup';

export { BranchConditionGroup };
