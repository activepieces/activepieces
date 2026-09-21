import {
  ApFlagId,
  BranchOperator,
  DEFAULT_AI_CONDITION_THRESHOLD,
  textConditions,
  singleValueConditions,
  RouterAction,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Trash } from 'lucide-react';
import { useFormContext, useWatch } from 'react-hook-form';

import { SearchableSelect } from '@/components/custom/searchable-select';
import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { flagsHooks } from '@/hooks/flags-hooks';

import { InvalidStepIcon } from '../../../../components/custom/alert-icon';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../../../components/ui/tooltip';
import { TextInputWithMentions } from '../../piece-properties/text-input-with-mentions';

const textToBranchOperation: Record<BranchOperator, string> = {
  [BranchOperator.TEXT_CONTAINS]: t('Contains (Text)'),
  [BranchOperator.TEXT_DOES_NOT_CONTAIN]: t('Does not contain (Text)'),
  [BranchOperator.TEXT_EXACTLY_MATCHES]: t('Exactly matches (Text)'),
  [BranchOperator.TEXT_DOES_NOT_EXACTLY_MATCH]: t(
    'Does not exactly match (Text)',
  ),
  [BranchOperator.TEXT_STARTS_WITH]: t('Starts with (Text)'),
  [BranchOperator.TEXT_DOES_NOT_START_WITH]: t('Does not start with (Text)'),
  [BranchOperator.TEXT_ENDS_WITH]: t('Ends with (Text)'),
  [BranchOperator.TEXT_DOES_NOT_END_WITH]: t('Does not end with (Text)'),
  [BranchOperator.LIST_CONTAINS]: t('Contains (List)'),
  [BranchOperator.LIST_DOES_NOT_CONTAIN]: t('Does not contain (List)'),
  [BranchOperator.NUMBER_IS_GREATER_THAN]: t('Is greater than (Number)'),
  [BranchOperator.NUMBER_IS_LESS_THAN]: t('Is less than (Number)'),
  [BranchOperator.NUMBER_IS_EQUAL_TO]: t('Is equal to (Number)'),
  [BranchOperator.DATE_IS_AFTER]: t('After (Date/time)'),
  [BranchOperator.DATE_IS_BEFORE]: t('Before (Date/time)'),
  [BranchOperator.DATE_IS_EQUAL]: t('Equals (Date/time)'),
  [BranchOperator.BOOLEAN_IS_TRUE]: t('Is true (Boolean)'),
  [BranchOperator.BOOLEAN_IS_FALSE]: t('Is false (Boolean)'),
  [BranchOperator.LIST_IS_EMPTY]: t('Is empty (List)'),
  [BranchOperator.LIST_IS_NOT_EMPTY]: t('Is not empty (List)'),
  [BranchOperator.EXISTS]: t('Exists'),
  [BranchOperator.DOES_NOT_EXIST]: t('Does not exist'),
  [BranchOperator.AI_MATCHES]: t('Answers yes to (AI)'),
};

const CONFIDENCE_OPTIONS = [
  { value: String(DEFAULT_AI_CONDITION_THRESHOLD), label: t('50% — maybe') },
  { value: '0.7', label: t('70% — likely') },
  { value: '0.9', label: t('90% — very likely') },
];

const operationOptionsFor = (aiRouterEnabled: boolean) =>
  Object.keys(textToBranchOperation)
    .filter(
      (operator) => aiRouterEnabled || operator !== BranchOperator.AI_MATCHES,
    )
    .map((operator) => {
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
  const { data: aiRouterEnabled } = flagsHooks.useFlag<boolean>(
    ApFlagId.AI_ROUTER_ENABLED,
  );

  const condition = useWatch({
    control: form.control,
    name: `settings.branches.${branchIndex}.conditions.${groupIndex}.${conditionIndex}`,
  });

  const isTextCondition =
    condition.operator && textConditions.includes(condition?.operator);
  const isSingleValueCondition =
    condition.operator && singleValueConditions.includes(condition?.operator);
  const isAiCondition = condition.operator === BranchOperator.AI_MATCHES;
  const isInvalid = isSingleValueCondition
    ? condition.firstValue.length === 0
    : condition.firstValue.length === 0 ||
      ('secondValue' in condition && condition.secondValue?.length === 0);
  return (
    <>
      <div className="flex flex-col gap-3 grow">
        <FormField
          name={`settings.branches.${branchIndex}.conditions.${groupIndex}.${conditionIndex}.firstValue`}
          control={form.control}
          render={({ field }) => {
            return (
              <FormItem className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Label>{t('First value')}</Label>
                  {isInvalid && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <InvalidStepIcon className="h-4 w-4 shrink-0"></InvalidStepIcon>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        {t('Incomplete condition')}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <TextInputWithMentions
                  disabled={readonly}
                  onChange={(value) => {
                    field.onChange(value);
                    form.trigger();
                  }}
                  initialValue={field.value}
                ></TextInputWithMentions>
              </FormItem>
            );
          }}
        />
        <FormField
          name={`settings.branches.${branchIndex}.conditions.${groupIndex}.${conditionIndex}.operator`}
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1">
              <Label>{t('Condition')}</Label>
              <SearchableSelect
                disabled={readonly}
                value={field.value}
                options={operationOptionsFor(aiRouterEnabled ?? false)}
                placeholder={''}
                onChange={(e) => {
                  if (
                    isSingleValueCondition &&
                    e !== null &&
                    !singleValueConditions.includes(e as BranchOperator)
                  ) {
                    //TODO: fix this
                    //@ts-expect-ignore
                    form.setValue(
                      `settings.branches.${branchIndex}.conditions.${groupIndex}.${conditionIndex}.secondValue`,
                      '' as any,
                    );
                  }
                  field.onChange(e);
                  form.trigger();
                }}
              />
            </FormItem>
          )}
        />
        {!isSingleValueCondition && (
          <FormField
            name={`settings.branches.${branchIndex}.conditions.${groupIndex}.${conditionIndex}.secondValue`}
            control={form.control}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1">
                <Label>
                  {isAiCondition ? t('Question') : t('Second value')}
                </Label>
                {isAiCondition && (
                  <span className="text-xs text-muted-foreground">
                    {t(
                      'Yes or no, about the value above. "Is this above our refund limit?"',
                    )}
                  </span>
                )}
                <TextInputWithMentions
                  disabled={readonly}
                  initialValue={field.value || ''}
                  onChange={(value) => {
                    field.onChange(value);
                    form.trigger();
                  }}
                ></TextInputWithMentions>
              </FormItem>
            )}
          />
        )}
        {isAiCondition && (
          <FormField
            name={`settings.branches.${branchIndex}.conditions.${groupIndex}.${conditionIndex}.threshold`}
            control={form.control}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1">
                <Label>{t('Take this branch')}</Label>
                <span className="text-xs text-muted-foreground">
                  {t('Below this, the branch is skipped.')}
                </span>
                <SearchableSelect
                  disabled={readonly}
                  value={String(field.value ?? DEFAULT_AI_CONDITION_THRESHOLD)}
                  options={CONFIDENCE_OPTIONS}
                  placeholder={''}
                  onChange={(value) => {
                    field.onChange(Number(value));
                    form.trigger();
                  }}
                />
              </FormItem>
            )}
          />
        )}
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
        <div className="grow"></div>
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
