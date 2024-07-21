import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { Trash } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { SearchableSelect } from '@/components/custom/searchable-select';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HorizontalSeperatorWithText } from '@/components/ui/seperator';
import { Switch } from '@/components/ui/switch';
import {
  BranchAction,
  BranchCondition,
  BranchOperator,
  BranchTextCondition,
  textConditions,
} from '@activepieces/shared';

const textToBranchOperation: Record<BranchOperator, string> = {
  [BranchOperator.TEXT_CONTAINS]: '(Text) Contains',
  [BranchOperator.TEXT_DOES_NOT_CONTAIN]: '(Text) Does not contain',
  [BranchOperator.TEXT_EXACTLY_MATCHES]: '(Text) Exactly matches',
  [BranchOperator.TEXT_DOES_NOT_EXACTLY_MATCH]: '(Text) Does not exactly match',
  [BranchOperator.TEXT_STARTS_WITH]: '(Text) Starts with',
  [BranchOperator.TEXT_DOES_NOT_START_WITH]: '(Text) Does not start with',
  [BranchOperator.TEXT_ENDS_WITH]: '(Text) Ends with',
  [BranchOperator.TEXT_DOES_NOT_END_WITH]: '(Text) Does not end with',
  [BranchOperator.NUMBER_IS_GREATER_THAN]: '(Number) Is greater than',
  [BranchOperator.NUMBER_IS_LESS_THAN]: '(Number) Is less than',
  [BranchOperator.NUMBER_IS_EQUAL_TO]: '(Number) Is equal to',
  [BranchOperator.BOOLEAN_IS_TRUE]: '(Boolean) Is true',
  [BranchOperator.BOOLEAN_IS_FALSE]: '(Boolean) Is false',
  [BranchOperator.EXISTS]: 'Exists',
  [BranchOperator.DOES_NOT_EXIST]: 'Does not exist',
};
const operationOptions = Object.keys(textToBranchOperation).map((operator) => {
  return {
    label: textToBranchOperation[operator as BranchOperator],
    value: operator,
  };
});

const BranchSingleConditionForm = Type.Object({
  firstValue: Type.String(),
  secondValue: Type.Optional(Type.String()),
  operator: Type.Enum(BranchOperator),
  caseSensitive: Type.Optional(Type.Boolean()),
});
type BranchSingleConditionForm = Static<typeof BranchSingleConditionForm>;

type BranchSingleConditionProps = {
  showOr: boolean;
  showAnd?: boolean;
  condition: BranchCondition;
  onChange: (condition: BranchCondition) => void;
};

type BranchSettingsProps = {
  selectedStep: BranchAction;
};

const BranchSingleCondition = (props: BranchSingleConditionProps) => {
  const isTextCondition =
    props.condition.operator &&
    textConditions.includes(props.condition.operator);

  const form = useForm<BranchSingleConditionForm>({
    defaultValues: {
      firstValue: '',
      secondValue: '',
      operator: props.condition.operator,
      caseSensitive:
        (props.condition as BranchTextCondition)?.caseSensitive ?? false,
    },
    resolver: typeboxResolver(BranchSingleConditionForm),
  });

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-2"
        onChange={() => {
          const values = form.getValues();
          props.onChange(values as BranchCondition);
        }}
      >
        <Input
          type="text"
          placeholder="First value"
          {...form.register('firstValue')}
        />
        <SearchableSelect
          onChange={(value) =>
            form.setValue('operator', value as BranchOperator)
          }
          value={form.getValues().operator}
          options={operationOptions}
          placeholder={'Select a operator'}
        ></SearchableSelect>
        <Input
          type="text"
          placeholder="Select second value"
          {...form.register('secondValue')}
        ></Input>
        {isTextCondition && (
          <div className="flex items-center gap-2  p-1">
            <Switch
              id="case-sensitive"
              checked={form.getValues().caseSensitive}
              onCheckedChange={(checked) =>
                form.setValue('caseSensitive', checked)
              }
            ></Switch>
            <Label htmlFor="airplane-mode">Case sensitive</Label>
          </div>
        )}
        <div className="flex gap-2 text-center justify-center">
          {props.showAnd && (
            <Button variant="outline" size="sm">
              + And
            </Button>
          )}

          {props.showOr && (
            <Button variant="outline" size="sm">
              + Or
            </Button>
          )}
          <Button variant="outline" size="sm" className="text-destructive">
            <Trash className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </Form>
  );
};

const BranchSettings = ({ selectedStep }: BranchSettingsProps) => {
  const [conditionGroups] = useState(selectedStep.settings.conditions);

  return (
    <div className="flex flex-col gap-4">
      <div className="text-md">Conditions</div>
      {conditionGroups.map((conditionGroup, groupIndex) => {
        return (
          <div key={'group' + groupIndex}>
            {groupIndex > 0 && (
              <HorizontalSeperatorWithText>OR</HorizontalSeperatorWithText>
            )}
            <div className="flex flex-col gap-4">
              {conditionGroup.map((condition, conditionIndex) => {
                return (
                  <BranchSingleCondition
                    key={groupIndex + ':' + conditionIndex}
                    onChange={(condition) => {}}
                    condition={condition}
                    showAnd={conditionIndex === conditionGroup.length - 1}
                    showOr={
                      groupIndex === conditionGroups.length - 1 &&
                      conditionIndex === conditionGroup.length - 1
                    }
                  ></BranchSingleCondition>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export { BranchSettings };
