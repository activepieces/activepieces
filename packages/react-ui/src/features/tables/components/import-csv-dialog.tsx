import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { LogInIcon } from 'lucide-react';
import { parse } from 'papaparse';
import { useState } from 'react';
import { FieldErrors, useForm } from 'react-hook-form';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { ApMarkdown } from '@/components/custom/markdown';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { flagsHooks } from '@/hooks/flags-hooks';
import { api } from '@/lib/api';
import { ApFlagId } from '@activepieces/shared';

import { recordsApi } from '../lib/records-api';
import { FieldsMapping } from '../lib/utils';

import { useTableState } from './ap-table-state-provider';
import { FieldsMappingControl } from './fields-mapping';

type ImportCsvDialogProps = {
  open: boolean;
  setIsOpen: (open: boolean) => void;
};

const ImportCsvDialog = ({ open, setIsOpen }: ImportCsvDialogProps) => {
  const [tableId, setRecords, serverFields, serverRecords, recordsCount] =
    useTableState((state) => [
      state.table.id,
      state.setRecords,
      state.serverFields,
      state.serverRecords,
      state.records.length,
    ]);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [csvRecords, setCsvRecords] = useState<string[][]>([]);
  const { data: maxFileSize } = flagsHooks.useFlag<number>(
    ApFlagId.MAX_FILE_SIZE_MB,
  );
  const { data: maxRecords } = flagsHooks.useFlag<number>(
    ApFlagId.MAX_RECORDS_PER_TABLE,
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<{
    file: File;
    fieldsMapping: FieldsMapping;
  }>({
    defaultValues: {
      fieldsMapping: [],
    },
    resolver: (values) => {
      const errors: FieldErrors<{
        file: File | null;
        fieldsMapping: FieldsMapping;
      }> = {};
      if (!values.file) {
        errors.file = {
          message: t('Please select a csv file'),
          type: 'required',
        };
      }
      if (maxFileSize && values.file.size > maxFileSize * 1024 * 1024) {
        errors.file = {
          message: `${t('Max file size is {maxFileSize}MB', {
            maxFileSize: maxFileSize,
          })}`,
          type: 'maxSize',
        };
      }
      return {
        values: Object.keys(errors).length === 0 ? values : {},
        errors,
      };
    },
  });

  const { mutate: importCsv, isPending: isLoading } = useMutation({
    mutationFn: async (data: { file: File; fieldsMapping: FieldsMapping }) => {
      setServerError(null);
      const records = await recordsApi.importCsv({
        csvRecords,
        tableId,
        fieldsMapping: data.fieldsMapping,
        maxRecordsLimit: (maxRecords ?? 1000) - recordsCount,
      });
      setRecords([...serverRecords, ...records]);
    },
    onSuccess: async () => {
      setIsOpen(false);
    },
    onError: (error) => {
      if (api.isError(error) && error.response?.data) {
        setServerError(JSON.stringify(error.response.data));
      } else {
        setServerError(error.message);
      }
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setIsOpen(value);
        setCsvColumns([]);
        form.reset();
      }}
    >
      <DialogTrigger>
        <Button variant="outline" size="sm" className="flex gap-2 items-center">
          <LogInIcon className="w-4 h-4 shrink-0" />
          {t('Import')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Import CSV')}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => importCsv(data))}
            className="space-y-4"
          >
            <ApMarkdown
              markdown={`
                ${t(
                  'Imported records will be added to the bottom of the table',
                )} \n           
                ${t(
                  'Any records after the limit ({maxRecords} records) will be ignored',
                  { maxRecords: maxRecords ?? 0 },
                )}
                    `}
            />
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('CSV File')}</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={async (e) => {
                        field.onChange(e.target.files?.[0]);

                        const csvRecords = await new Promise<string[][]>(
                          (resolve) => {
                            if (!e.target.files || !e.target.files[0]) return;
                            parse(e.target.files[0], {
                              header: false,
                              skipEmptyLines: 'greedy',
                              worker: true,
                              complete: (results) => {
                                resolve(results.data as string[][]);
                              },
                            });
                          },
                        );
                        setCsvColumns(csvRecords[0] ?? []);
                        setCsvRecords(csvRecords.slice(1));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <ScrollArea className="max-h-[calc(100vh-500px)] overflow-y-auto flex-1">
              {csvColumns.length > 0 && (
                <FormField
                  control={form.control}
                  name="fieldsMapping"
                  key={form.watch('file')?.name}
                  render={({ field }) => (
                    <FormItem>
                      <FieldsMappingControl
                        fields={serverFields}
                        csvColumns={csvColumns}
                        onChange={field.onChange}
                      />
                    </FormItem>
                  )}
                />
              )}
            </ScrollArea>

            {serverError && (
              <div className=" flex items-center justify-between">
                {' '}
                <div className="text-red-500">
                  {t(
                    'An unexpected error occurred while importing the csv file, please hit the copy error and send it to support',
                  )}
                </div>
                <div className="min-w-4">
                  <CopyButton
                    variant="ghost"
                    withoutTooltip={true}
                    textToCopy={serverError}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" size="sm" disabled={isLoading}>
                  {t('Cancel')}
                </Button>
              </DialogClose>
              <Button type="submit" size="sm" loading={isLoading}>
                {t('Import')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

ImportCsvDialog.displayName = 'ImportCsvDialog';
export { ImportCsvDialog };
