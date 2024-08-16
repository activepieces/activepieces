import React from 'react';
import { useFormContext } from 'react-hook-form';
import { t } from 'i18next';

import { HorizontalSeparatorWithText } from '@/components/ui/seperator';
import {
  BranchAction,
  BranchOperator,
  ValidBranchCondition,
} from '@activepieces/shared';

import { BranchSingleCondition } from './branch-condition-group';
import { BranchConditionToolbar } from './branch-condition-toolbar';

const emptyCondition: ValidBranchCondition = {
  firstValue: '',
  secondValue: '',
  operator: BranchOperator.TEXT_CONTAINS,
  caseSensitive: false,
};

type BranchSettingsProps = {
  readonly: boolean;
};

const BranchSettings = React.memo(({ readonly }: BranchSettingsProps) => {
  const form = useFormContext<BranchAction>();

  const handleDelete = (groupIndex: number, conditionIndex: number) => {
    const conditions = form.getValues().settings.conditions;
    const newConditionsGroup = [...conditions[groupIndex]];
    const isSingleGroup = conditions.length === 1;
    const isSingleConditionInGroup = newConditionsGroup.length === 1;

    let newConditions;

    if (isSingleGroup && isSingleConditionInGroup) {
      newConditions = [[emptyCondition]];
    } else if (isSingleConditionInGroup) {
      newConditions = conditions.filter((_, index) => index !== groupIndex);
    } else {
      newConditionsGroup.splice(conditionIndex, 1);
      newConditions = [...conditions];
      newConditions[groupIndex] = newConditionsGroup;
    }
    form.setValue('settings.conditions', newConditions, {
      shouldValidate: true,
    });
  };
  const handleAnd = (groupIndex: number) => {
    const conditions = form.getValues().settings.conditions;
    conditions[groupIndex] = [...conditions[groupIndex], emptyCondition];
    form.setValue('settings.conditions', conditions, { shouldValidate: true });
  };

  const handleOr = () => {
    const conditions = form.getValues().settings.conditions;
    conditions.push([emptyCondition]);
    form.setValue('settings.conditions', conditions, { shouldValidate: true });
  };

  const conditions = form.getValues().settings.conditions;
  return (
    <div className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
      <div className="text-md">{t('Continue If')}</div>
      {conditions.map((fieldGroup, groupIndex) => {
        return (
          <div className="flex flex-col gap-4" key={`group-${groupIndex}`}>
            {groupIndex > 0 && (
              <HorizontalSeparatorWithText className="my-2">
                {t('OR')}
              </HorizontalSeparatorWithText>
            )}
            {fieldGroup.length === 0 && (
              <BranchConditionToolbar
                readonly={readonly}
                key={`toolbar-${groupIndex}`}
                onAnd={() => handleAnd(groupIndex)}
                onOr={() => handleOr()}
                showOr={groupIndex === conditions.length - 1}
                showAnd={true}
              ></BranchConditionToolbar>
            )}
            {fieldGroup.map((condition, conditionIndex) => (
              <React.Fragment
                key={`condition-${groupIndex}-${conditionIndex}-${condition.operator}`}
              >
                {conditionIndex > 0 && <div>{t('And If')}</div>}
                <BranchSingleCondition
                  groupIndex={groupIndex}
                  readonly={readonly}
                  conditionIndex={conditionIndex}
                  deleteClick={() => handleDelete(groupIndex, conditionIndex)}
                  showDelete={
                    conditions.length !== 1 || fieldGroup.length !== 1
                  }
                ></BranchSingleCondition>
              </React.Fragment>
            ))}
            <BranchConditionToolbar
              onAnd={() => handleAnd(groupIndex)}
              onOr={() => handleOr()}
              readonly={readonly}
              showOr={groupIndex === conditions.length - 1}
              showAnd={true}
            ></BranchConditionToolbar>
          </div>
        );
      })}
    </div>
  );
});

BranchSettings.displayName = 'BranchSettings';
export { BranchSettings };