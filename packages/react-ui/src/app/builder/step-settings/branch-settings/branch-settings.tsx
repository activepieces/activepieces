import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import React from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

import { Form } from '@/components/ui/form';
import { flowVersionUtils } from '@/features/flows/lib/flow-version-util';
import {
  BranchAction,
  BranchOperator,
  ValidBranchCondition,
} from '@activepieces/shared';

import { BranchSingleCondition } from './branch-condition-group';
import { BranchSingleConditionToolbar } from './branch-condition-toolbar';

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
    if (groupIndex > 0 && newConditionsGroup.length === 1) {
      remove(groupIndex);
    } else {
      if (newConditionsGroup.length > 1) {
        newConditionsGroup.splice(conditionIndex, 1);
      }
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
    console.log(form.formState.isValid);
    console.log({ conditions });
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
        <div className="text-md">Conditions</div>
        {fields.map((fieldGroup, groupIndex) => {
          return (
            <div className="flex flex-col gap-4" key={`group-${groupIndex}`}>
              {fieldGroup.andGroup.length === 0 && (
                <BranchSingleConditionToolbar
                  key={`toolbar-${groupIndex}`}
                  showDelete={false}
                  onAnd={() => handleAnd(groupIndex)}
                  onOr={() => handleOr()}
                  showOr={groupIndex === fields.length - 1}
                  showAnd={true}
                ></BranchSingleConditionToolbar>
              )}
              {fieldGroup.andGroup.map((condition, conditionIndex) => (
                <React.Fragment
                  key={`condition-${groupIndex}-${conditionIndex}-${condition.operator}`}
                >
                  <BranchSingleCondition
                    onChange={(condition) =>
                      handleChange(condition, groupIndex, conditionIndex)
                    }
                    condition={condition}
                  ></BranchSingleCondition>
                  <BranchSingleConditionToolbar
                    showDelete={groupIndex !== 0 || conditionIndex !== 0}
                    deleteClick={() => handleDelete(groupIndex, conditionIndex)}
                    onAnd={() => handleAnd(groupIndex)}
                    onOr={() => handleOr()}
                    showOr={
                      groupIndex === fields.length - 1 &&
                      conditionIndex === fieldGroup.andGroup.length - 1
                    }
                    showAnd={conditionIndex === fieldGroup.andGroup.length - 1}
                  ></BranchSingleConditionToolbar>
                </React.Fragment>
              ))}
            </div>
          );
        })}
      </div>
    </Form>
  );
};

export { BranchSettings };
