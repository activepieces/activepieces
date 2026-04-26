import { t } from 'i18next';
import { useMemo, useState } from 'react';
import { ControllerRenderProps } from 'react-hook-form';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { DictionaryInput } from '@/components/custom/dictionary-input';
import { JsonEditor } from '@/components/custom/json-editor';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type CallableFlowSampleDataDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stepName: string;
};

export const CallableFlowSampleDataDialog = ({
  open,
  onOpenChange,
  stepName,
}: CallableFlowSampleDataDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Set Sample Input')}</DialogTitle>
        </DialogHeader>
        <CallableFlowSampleDataForm
          key={open ? 'open' : 'closed'}
          onOpenChange={onOpenChange}
          stepName={stepName}
        />
      </DialogContent>
    </Dialog>
  );
};

type CallableFlowSampleDataFormProps = {
  onOpenChange: (open: boolean) => void;
  stepName: string;
};

const CallableFlowSampleDataForm = ({
  onOpenChange,
  stepName,
}: CallableFlowSampleDataFormProps) => {
  const [updateSampleData, existingOutput] = useBuilderStateContext((state) => [
    state.updateSampleData,
    state.outputSampleData[stepName],
  ]);
  const initialValue = useMemo(
    () => coerceToRecord(existingOutput),
    [existingOutput],
  );
  const [tab, setTab] = useState<'fields' | 'json'>('fields');
  const [fieldsValue, setFieldsValue] = useState<Record<string, string>>(
    flattenStrings(initialValue),
  );
  const [jsonValue, setJsonValue] =
    useState<Record<string, unknown>>(initialValue);

  const onSave = () => {
    const output = tab === 'fields' ? fieldsValue : jsonValue;
    updateSampleData({ stepName, output });
    onOpenChange(false);
  };

  const jsonField: ControllerRenderProps<Record<string, unknown>, string> = {
    value: jsonValue,
    onChange: (next) => {
      if (next && typeof next === 'object' && !Array.isArray(next)) {
        setJsonValue(next as Record<string, unknown>);
      }
    },
    onBlur: () => undefined,
    name: 'sampleData',
    ref: () => undefined,
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {t(
          'Define the data this flow expects to receive when another flow calls it.',
        )}
      </p>
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'fields' | 'json')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fields">{t('Fields')}</TabsTrigger>
          <TabsTrigger value="json">{t('JSON')}</TabsTrigger>
        </TabsList>
        <TabsContent value="fields">
          <DictionaryInput
            values={fieldsValue}
            onChange={(record) => setFieldsValue(unwrapDictionaryEvent(record))}
            keyPlaceholder={t('Field name')}
            valuePlaceholder={t('Sample value')}
          />
        </TabsContent>
        <TabsContent value="json">
          <JsonEditor field={jsonField} readonly={false} />
        </TabsContent>
      </Tabs>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            {t('Cancel')}
          </Button>
        </DialogClose>
        <Button type="button" onClick={onSave}>
          {t('Save as Sample Data')}
        </Button>
      </DialogFooter>
    </div>
  );
};

const coerceToRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
};

const flattenStrings = (
  obj: Record<string, unknown>,
): Record<string, string> => {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      typeof v === 'string' ? v : JSON.stringify(v),
    ]),
  );
};

const unwrapDictionaryEvent = (
  input: Record<string, string>,
): Record<string, string> => {
  const maybeEvent = input as unknown as {
    target?: { value?: Record<string, string> };
  };
  if (
    maybeEvent?.target?.value &&
    typeof maybeEvent.target.value === 'object'
  ) {
    return maybeEvent.target.value;
  }
  return input;
};
