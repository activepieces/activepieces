import {
  BranchAction,
  BranchOperator,
  ValidBranchCondition,
} from '@activepieces/shared';
import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import React from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

import { BranchSingleCondition } from './branch-condition-group';
import { BranchConditionToolbar } from './branch-condition-toolbar';

import { Form } from '@/components/ui/form';
import { HorizontalSeparatorWithText } from '@/components/ui/seperator';
import { flowVersionUtils } from '@/features/flows/lib/flow-version-util';

type BranchSettingsProps = {
  selectedStep: BranchAction;
  onActionUpdate: (action: BranchAction) => void;
};

const emptyCondition: ValidBranchCondition = {
  firstValue: '',
  secondValue: '',
  operator: BranchOperator.TEXT_CONTAINS,
  caseSensitive: false,
};

const formSchema = Type.Object({
  orGroups: Type.Array(
    Type.Object({
      andGroup: Type.Array(ValidBranchCondition),
    }),
  ),
});

type FormSchema = Static<typeof formSchema>;

const BranchSettings = ({
  selectedStep,
  onActionUpdate,
}: BranchSettingsProps) => {
  const form = useForm<FormSchema>({
    resolver: typeboxResolver(formSchema),
    defaultValues: {
      orGroups: selectedStep.settings.conditions.map((group) => {
        return {
          andGroup: group,
        };
      }),
    },
  });

  const { fields, update, append, remove } = useFieldArray({
    control: form.control,
    name: 'orGroups',
  });

  const handleDelete = (groupIndex: number, conditionIndex: number) => {
    const newConditionsGroup: ValidBranchCondition[] = JSON.parse(
      JSON.stringify(fields[groupIndex].andGroup),
    );

    const isSingleGroup = fields.length === 1;
    const isSingleConditionInGroup = newConditionsGroup.length === 1;

    if (isSingleGroup && isSingleConditionInGroup) {
      update(groupIndex, {
        andGroup: [emptyCondition],
      });
    } else if (isSingleConditionInGroup) {
      remove(groupIndex);
    } else {
      newConditionsGroup.splice(conditionIndex, 1);
      update(groupIndex, {
        andGroup: newConditionsGroup,
      });
    }
    triggerChange();
  };

  const handleChange = (
    condition: ValidBranchCondition,
    groupIndex: number,
    conditionIndex: number,
  ) => {
    const group = JSON.parse(JSON.stringify(fields[groupIndex]));
    group.andGroup[conditionIndex] = condition;
    update(groupIndex, group);
    triggerChange();
  };

  const handleAnd = (groupIndex: number) => {
    const andGroup = fields[groupIndex].andGroup;
    update(groupIndex, { andGroup: [...andGroup, emptyCondition] });
    triggerChange();
  };

  const handleOr = () => {
    append({ andGroup: [emptyCondition] });
    triggerChange();
  };

  const triggerChange = async () => {
    await form.trigger();
    const conditions = form.getValues().orGroups.map((group) => group.andGroup);
    onActionUpdate(
      flowVersionUtils.buildActionWithBranchCondition(
        selectedStep,
        conditions,
        form.formState.isValid,
      ),
    );
  };

  return (
    <Form {...form}>
      <div className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
        <div className="text-md">Continue If</div>
        {fields.map((fieldGroup, groupIndex) => {
          return (
            <div className="flex flex-col gap-4" key={`group-${groupIndex}`}>
              {groupIndex > 0 && (
                <HorizontalSeparatorWithText className="my-2">
                  OR
                </HorizontalSeparatorWithText>
              )}
              {fieldGroup.andGroup.length === 0 && (
                <BranchConditionToolbar
                  key={`toolbar-${groupIndex}`}
                  onAnd={() => handleAnd(groupIndex)}
                  onOr={() => handleOr()}
                  showOr={groupIndex === fields.length - 1}
                  showAnd={true}
                ></BranchConditionToolbar>
              )}
              {fieldGroup.andGroup.map((condition, conditionIndex) => (
                <React.Fragment
                  key={`condition-${groupIndex}-${conditionIndex}-${condition.operator}`}
                >
                  {conditionIndex > 0 && <div>And If</div>}
                  <BranchSingleCondition
                    deleteClick={() => handleDelete(groupIndex, conditionIndex)}
                    showDelete={
                      fields.length !== 1 || fieldGroup.andGroup.length !== 1
                    }
                    onChange={(condition) =>
                      handleChange(condition, groupIndex, conditionIndex)
                    }
                    condition={condition}
                  ></BranchSingleCondition>
                </React.Fragment>
              ))}
              <BranchConditionToolbar
                onAnd={() => handleAnd(groupIndex)}
                onOr={() => handleOr()}
                showOr={groupIndex === fields.length - 1}
                showAnd={true}
              ></BranchConditionToolbar>
            </div>
          );
        })}
      </div>
    </Form>
  );
};

export { BranchSettings };
