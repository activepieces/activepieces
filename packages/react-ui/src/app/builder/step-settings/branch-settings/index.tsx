import { t } from 'i18next';
import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';

import { BranchConditionGroup } from '@/app/builder/step-settings/branch-settings/branch-condition-group';
import { ConditionType, emptyCondition } from '@activepieces/shared';
import { FormField, FormItem } from '@/components/ui/form';
import { TextInputWithMentions } from '@/app/builder/piece-properties/text-input-with-mentions';
import { ReadMoreDescription } from '@/components/ui/read-more-description';

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
    const conditionType = form.watch(`settings.conditionType`);

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
        <div className="text-md justify-between flex items-center">{t('Execute If')}</div>
        {conditionType === ConditionType.LOGICAL && 
          fields.map((fieldGroup, groupIndex) => (
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
          ))
        }
        {conditionType === ConditionType.TEXT && (
          <div className="flex flex-col gap-2">
            <FormField
              name={`settings.branches.${branchIndex}.prompt`}
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <TextInputWithMentions
                    disabled={readonly}
                    placeholder={t('Check if the email is spam or has suspicious content')}
                    onChange={(value: string) => {
                      field.onChange(value);
                      form.setValue(`settings.branches.${branchIndex}.prompt`, value, {
                        shouldValidate: true,
                      });
                    }}
                    initialValue={field.value}
                  />  
                </FormItem>
              )}
            />
            <ReadMoreDescription text={t('AI will analyze the content and route to this branch if the condition is met')} />
          </div>
        )}

      </div>
    );
  },
);

BranchSettings.displayName = 'BranchSettings';
export { BranchSettings };
