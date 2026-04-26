import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { ControllerRenderProps, useForm } from 'react-hook-form';
import { z } from 'zod';

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
import { Form, FormField, FormItem } from '@/components/ui/form';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const form = useForm<SampleDataFormValues>({
    resolver: zodResolver(SampleDataSchema),
    mode: 'onChange',
    defaultValues: {
      mode: SampleDataMode.FIELDS,
      value: isPlainObject(existingOutput) ? existingOutput : {},
    },
  });

  const handleSubmit = (data: SampleDataFormValues) => {
    updateSampleData({ stepName, output: data.value });
    onOpenChange(false);
  };

  const mode = form.watch('mode');

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <p className="text-sm text-muted-foreground">
          {t(
            'Define the data this flow expects to receive when another flow calls it.',
          )}
        </p>
        <FormField
          control={form.control}
          name="mode"
          render={({ field }) => (
            <FormItem>
              <Tabs
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  form.setValue('value', {});
                }}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value={SampleDataMode.FIELDS}>
                    {t('Fields')}
                  </TabsTrigger>
                  <TabsTrigger value={SampleDataMode.JSON}>
                    {t('JSON')}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <SampleDataInput mode={mode} field={field} />
            </FormItem>
          )}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {t('Cancel')}
            </Button>
          </DialogClose>
          <Button type="submit">{t('Save as Sample Data')}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

const SampleDataInput = ({
  mode,
  field,
}: {
  mode: SampleDataMode;
  field: ControllerRenderProps<any>;
}) => {
  switch (mode) {
    case SampleDataMode.FIELDS:
      return (
        <DictionaryInput
          values={field.value}
          onChange={field.onChange}
          keyPlaceholder={t('Field name')}
          valuePlaceholder={t('Sample value')}
        />
      );
    case SampleDataMode.JSON:
      return <JsonEditor field={field} readonly={false} />;
  }
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return !!value && typeof value === 'object' && !Array.isArray(value);
};

enum SampleDataMode {
  FIELDS = 'fields',
  JSON = 'json',
}

const SampleDataSchema = z.object({
  mode: z.enum(SampleDataMode),
  value: z.record(z.string(), z.unknown()),
});

type SampleDataFormValues = z.infer<typeof SampleDataSchema>;
