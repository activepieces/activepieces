import { Trash } from 'lucide-react';
import { useFormContext } from 'react-hook-form';

import { SearchableSelect } from '@/components/custom/searchable-select';
import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  BranchOperator,
  textConditions,
  singleValueConditions,
  BranchAction,
} from '@activepieces/shared';

import { TextInputWithMentions } from '../../data-to-insert/text-input-with-mentions';

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

type BranchSingleConditionProps = {
  showDelete: boolean;
  groupIndex: number;
  conditionIndex: number;
  deleteClick: () => void;
};

const BranchSingleCondition = ({
  deleteClick,
  groupIndex,
  conditionIndex,
  showDelete,
}: BranchSingleConditionProps) => {
  const form = useFormContext<BranchAction>();

  const condition =
    form.getValues().settings.conditions[groupIndex][conditionIndex];
  const isTextCondition =
    condition.operator && textConditions.includes(condition?.operator);
  const isSingleValueCondition =
    condition.operator && singleValueConditions.includes(condition?.operator);
  return (
    <>
      <div
        className={cn('grid gap-2', {
          'grid-cols-2': isSingleValueCondition,
          'grid-cols-3': !isSingleValueCondition,
        })}
      >
        <FormField
          name={`settings.conditions.${groupIndex}.${conditionIndex}.firstValue`}
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <TextInputWithMentions
                placeholder="First value"
                onChange={field.onChange}
                originalValue={field.value}
              ></TextInputWithMentions>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name={`settings.conditions.${groupIndex}.${conditionIndex}.operator`}
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <SearchableSelect
                value={field.value}
                options={operationOptions}
                placeholder={''}
                onChange={(e) => field.onChange(e)}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        {!isSingleValueCondition && (
          <FormField
            name={`settings.conditions.${groupIndex}.${conditionIndex}.secondValue`}
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <TextInputWithMentions
                  placeholder="Second value"
                  {...field}
                  originalValue={field.value}
                ></TextInputWithMentions>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      <div className="flex justify-start items-center gap-2 mt-2">
        {isTextCondition && (
          <FormField
            name={`settings.conditions.${groupIndex}.${conditionIndex}.caseSensitive`}
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2 p-1">
                  <Switch
                    id="case-sensitive"
                    checked={field.value}
                    onCheckedChange={(e) => field.onChange(e)}
                  />
                  <Label htmlFor="case-sensitive">Case sensitive</Label>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <div className="flex-grow"></div>
        <div>
          {showDelete && (
            <Button variant={'basic'} size={'sm'} onClick={deleteClick}>
              <Trash className="w-4 h-4"></Trash> Remove
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

BranchSingleCondition.displayName = 'BranchSingleCondition';
export { BranchSingleCondition };
