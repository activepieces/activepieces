import { t } from 'i18next';
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
  RouterAction,
} from '@activepieces/shared';

import { InvalidStepIcon } from '../../../../components/custom/alert-icon';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../../../components/ui/tooltip';
import { TextInputWithMentions } from '../../piece-properties/text-input-with-mentions';

const textToBranchOperation: Record<BranchOperator, string> = {
  [BranchOperator.TEXT_CONTAINS]: t('(Text) Contains'),
  [BranchOperator.TEXT_DOES_NOT_CONTAIN]: t('(Text) Does not contain'),
  [BranchOperator.TEXT_EXACTLY_MATCHES]: t('(Text) Exactly matches'),
  [BranchOperator.TEXT_DOES_NOT_EXACTLY_MATCH]: t(
    '(Text) Does not exactly match',
  ),
  [BranchOperator.TEXT_STARTS_WITH]: t('(Text) Starts with'),
  [BranchOperator.TEXT_DOES_NOT_START_WITH]: t('(Text) Does not start with'),
  [BranchOperator.TEXT_ENDS_WITH]: t('(Text) Ends with'),
  [BranchOperator.TEXT_DOES_NOT_END_WITH]: t('(Text) Does not end with'),
  [BranchOperator.LIST_CONTAINS]: t('(List) Contains'),
  [BranchOperator.LIST_DOES_NOT_CONTAIN]: t('(List) Does not contain'),
  [BranchOperator.NUMBER_IS_GREATER_THAN]: t('(Number) Is greater than'),
  [BranchOperator.NUMBER_IS_LESS_THAN]: t('(Number) Is less than'),
  [BranchOperator.NUMBER_IS_EQUAL_TO]: t('(Number) Is equal to'),
  [BranchOperator.DATE_IS_AFTER]: t('(Date/time) After'),
  [BranchOperator.DATE_IS_BEFORE]: t('(Date/time) Before'),
  [BranchOperator.DATE_IS_EQUAL]: t('(Date/time) Equals'),
  [BranchOperator.BOOLEAN_IS_TRUE]: t('(Boolean) Is true'),
  [BranchOperator.BOOLEAN_IS_FALSE]: t('(Boolean) Is false'),
  [BranchOperator.LIST_IS_EMPTY]: t('(List) Is empty'),
  [BranchOperator.LIST_IS_NOT_EMPTY]: t('(List) Is not empty'),
  [BranchOperator.EXISTS]: t('Exists'),
  [BranchOperator.DOES_NOT_EXIST]: t('Does not exist'),
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
  readonly: boolean;
  deleteClick: () => void;
  branchIndex: number;
};

const BranchSingleCondition = ({
  deleteClick,
  groupIndex,
  conditionIndex,
  showDelete,
  readonly,
  branchIndex,
}: BranchSingleConditionProps) => {
  const form = useFormContext<RouterAction>();

  const condition = form.getValues(
    `settings.branches.${branchIndex}.conditions.${groupIndex}.${conditionIndex}`,
  );

  const isTextCondition =
    condition.operator && textConditions.includes(condition?.operator);
  const isSingleValueCondition =
    condition.operator && singleValueConditions.includes(condition?.operator);
  const isInvalid = isSingleValueCondition
    ? condition.firstValue.length === 0
    : condition.firstValue.length === 0 ||
      ('secondValue' in condition && condition.secondValue?.length === 0);
  return (
    <>
      <div className="flex items-center gap-2">
        {isInvalid && (
          <Tooltip>
            <TooltipTrigger asChild>
              <InvalidStepIcon
                size={16}
                viewBox="0 0 16 16"
                className="stroke-0 animate-fade shrink-0"
              ></InvalidStepIcon>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {t('Incomplete condition')}
            </TooltipContent>
          </Tooltip>
        )}
        <div
          className={cn('grid gap-2 grow', {
            'grid-cols-2': isSingleValueCondition,
            'grid-cols-3': !isSingleValueCondition,
          })}
        >
          <FormField
            name={`settings.branches.${branchIndex}.conditions.${groupIndex}.${conditionIndex}.firstValue`}
            control={form.control}
            render={({ field }) => {
              return (
                <FormItem>
                  <TextInputWithMentions
                    disabled={readonly}
                    placeholder={t('First value')}
                    onChange={field.onChange}
                    initialValue={field.value}
                  ></TextInputWithMentions>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            name={`settings.branches.${branchIndex}.conditions.${groupIndex}.${conditionIndex}.operator`}
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <SearchableSelect
                  disabled={readonly}
                  value={field.value}
                  options={operationOptions}
                  placeholder={''}
                  onChange={(e) => {
                    if (
                      isSingleValueCondition &&
                      e !== null &&
                      !singleValueConditions.includes(e as BranchOperator)
                    ) {
                      form.setValue(
                        `settings.branches.${branchIndex}.conditions.${groupIndex}.${conditionIndex}.secondValue`,
                        '',
                      );
                    }
                    field.onChange(e);
                  }}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          {!isSingleValueCondition && (
            <FormField
              name={`settings.branches.${branchIndex}.conditions.${groupIndex}.${conditionIndex}.secondValue`}
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <TextInputWithMentions
                    placeholder={t('Second value')}
                    disabled={readonly}
                    initialValue={field.value || ''}
                    onChange={field.onChange}
                  ></TextInputWithMentions>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      </div>

      <div className="flex justify-start items-center gap-2 mt-2">
        {isTextCondition && (
          <FormField
            name={`settings.branches.${branchIndex}.conditions.${groupIndex}.${conditionIndex}.caseSensitive`}
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2 p-1">
                  <Switch
                    disabled={readonly}
                    id="case-sensitive"
                    checked={field.value}
                    onCheckedChange={(e) => field.onChange(e)}
                  />
                  <Label htmlFor="case-sensitive">{t('Case sensitive')}</Label>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <div className="flex-grow"></div>
        <div>
          {showDelete && (
            <Button
              variant={'basic'}
              className="text-destructive gap-2 items-center"
              size={'sm'}
              onClick={deleteClick}
            >
              <Trash className="w-4 h-4"></Trash> {t('Remove')}
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

BranchSingleCondition.displayName = 'BranchSingleCondition';
export { BranchSingleCondition };
