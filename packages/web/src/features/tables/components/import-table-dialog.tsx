import {
  ApFlagId,
  isNil,
  SharedTemplate,
  tryCatch,
  tryCatchSync,
} from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Import } from 'lucide-react';
import { useState } from 'react';
import { ResolverResult, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { ApMarkdown } from '@/components/custom/markdown';
import { useEmbedding } from '@/components/providers/embed-provider';
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
import { authenticationSession } from '@/lib/authentication-session';

import { recordsApi } from '../api/records-api';
import { tableHooks } from '../hooks/table-hooks';
import {
  FieldsMapping,
  fileUtils,
  SupportedFileType,
  tablesUtils,
} from '../utils/utils';

import { useOptionalTableStore } from './ap-table-state-provider';
import { FieldsMappingControl } from './fields-mapping';

const ImportTableDialog = ({
  open,
  setIsOpen,
  showTrigger = true,
  ...formProps
}: ImportTableDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={(value) => setIsOpen?.(value)}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex gap-2 items-center"
          >
            <Import className="w-4 h-4 shrink-0" />
            {t('Import')}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Import Table')}</DialogTitle>
        </DialogHeader>
        <ImportTableForm {...formProps} onClose={() => setIsOpen?.(false)} />
      </DialogContent>
    </Dialog>
  );
};

const ImportTableForm = ({
  tableId,
  folderId,
  onImportSuccess,
  onClose,
}: ImportTableFormProps & { onClose: () => void }) => {
  const navigate = useNavigate();
  const projectId = authenticationSession.getProjectId() ?? '';
  const [columnNamesInCsv, setColumnNamesInCsv] = useState<string[]>([]);
  const { data: maxFileSize } = flagsHooks.useFlag<number>(
    ApFlagId.MAX_FILE_SIZE_MB,
  );
  const maxRecords =
    flagsHooks.useFlag<number>(ApFlagId.MAX_RECORDS_PER_TABLE).data ?? 1000;
  const tableStore = useOptionalTableStore();
  const isEmbedded = useEmbedding().embedState.isEmbedded;
  const allowedFileTypes: SupportedFileType[] =
    tableId && tableStore ? ['json', 'csv'] : ['json'];

  const form = useForm<ImportTableFormValues>({
    mode: 'onChange',
    defaultValues: {
      fieldsMapping: [],
    },
    resolver: async (
      values,
    ): Promise<ResolverResult<ImportTableFormValues>> => {
      const error = await getFileError(values.file);
      if (isNil(error)) {
        return { values, errors: {} };
      }
      return {
        values: {},
        errors: { file: { type: 'invalid', message: error } },
      };
    },
  });

  const file = form.watch('file');
  const fileType = file ? fileUtils.getExtension(file.name) : null;
  const serverError = form.formState.errors.root?.serverError?.message;
  const showTemplateDocsLink =
    fileType === 'json' && !isNil(form.formState.errors.file) && !isEmbedded;

  const getFileError = async (file: File | undefined) => {
    if (isNil(file)) {
      return t('Please select a JSON or CSV file');
    }
    const extension = fileUtils.getExtension(file.name);
    if (
      !fileUtils.isValidType(extension) ||
      !allowedFileTypes.includes(extension)
    ) {
      return t('Only {types} files are allowed', {
        types: allowedFileTypes.map((type) => type.toUpperCase()).join(', '),
      });
    }
    const validation = fileUtils.validateFile(file, maxFileSize ?? undefined);
    if (!validation.valid) {
      return t(validation.error ?? '');
    }
    if (extension === 'csv') {
      const { error } = await tryCatch(() => fileUtils.parseCsv(file));
      return error ? t('Failed to parse CSV file') : null;
    }
    const template = await readJsonTemplate(file);
    if (isNil(template)) {
      return t('This file is not a valid table template');
    }
    return tablesUtils.getTemplateError({ template, existingTableId: tableId });
  };

  const handleCsvImport = async ({
    file,
    fieldsMapping,
  }: ImportTableFormValues): Promise<ImportResult> => {
    if (!tableId || !tableStore) {
      throw new Error(t('CSV import is only available for existing tables'));
    }
    const [, ...csvRecords] = await fileUtils.parseCsv(file);
    const state = tableStore.getState();
    const records = await recordsApi.importCsv({
      csvRecords,
      tableId,
      fieldsMapping,
      maxRecordsLimit: maxRecords - state.records.length,
    });
    state.setRecords([...state.serverRecords, ...records]);
    return { tableId, importedRecordsCount: records.length };
  };

  const handleJsonImport = async (file: File): Promise<ImportResult> => {
    const template = await readJsonTemplate(file);
    if (isNil(template)) {
      throw new Error(t('This file is not a valid table template'));
    }
    if (tableId) {
      const { importedRecordsCount } = await tableHooks.importTableIntoExisting(
        {
          template,
          existingTableId: tableId,
          maxRecords,
        },
      );
      return { tableId, importedRecordsCount };
    }
    const [{ table, importedRecordsCount }] =
      await tableHooks.importTablesFromTemplates({
        templates: [template],
        projectId,
        maxRecords,
        folderId,
      });
    return { tableId: table.id, importedRecordsCount };
  };

  const { mutate: importFile, isPending: isLoading } = useMutation({
    mutationFn: async ({ file, fieldsMapping }: ImportTableFormValues) => {
      form.clearErrors('root.serverError');
      if (fileUtils.getExtension(file.name) === 'csv') {
        return await handleCsvImport({ file, fieldsMapping });
      }
      return await handleJsonImport(file);
    },
    onSuccess: (result) => {
      onClose();
      onImportSuccess?.({ importedRecordsCount: result.importedRecordsCount });
      if (!tableId) {
        navigate(`/projects/${projectId}/tables/${result.tableId}`);
      }
    },
    onError: (error) => {
      form.setError('root.serverError', {
        type: 'manual',
        message:
          api.isError(error) && error.response?.data
            ? JSON.stringify(error.response.data)
            : error.message,
      });
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => importFile(data))}
        className="space-y-4"
      >
        <ApMarkdown
          className="text-left"
          markdown={(() => {
            if (fileType === 'csv') {
              return [
                t('Import records from a CSV file'),
                t('Records will be added to the bottom of the table'),
                t(
                  'Any records after the limit ({maxRecords} records) will be ignored',
                  {
                    maxRecords,
                  },
                ),
              ].join('\n\n');
            }

            if (fileType === 'json' && tableId) {
              return [
                t(
                  '⚠️ **Warning:** This will completely replace the current table',
                ),
                t('All existing fields and records will be deleted'),
                t(
                  'Any records after the limit ({maxRecords} records) will be ignored',
                  {
                    maxRecords,
                  },
                ),
              ].join('\n\n');
            }

            if (!allowedFileTypes.includes('csv')) {
              return [
                t('Import a table from JSON template'),
                tableId
                  ? t(
                      '⚠️ This will completely replace the current table with the template structure and data',
                    )
                  : t('The table will be created with all its fields and data'),
                t(
                  'Any records after the limit ({maxRecords} records) will be ignored',
                  {
                    maxRecords,
                  },
                ),
              ].join('\n\n');
            }

            return [
              t('Import a table from JSON or add records from CSV'),
              t('**JSON:** Creates a new table with fields and data'),
              t('**CSV:** Adds records to an existing table'),
              t(
                'Any records after the limit ({maxRecords} records) will be ignored',
                {
                  maxRecords,
                },
              ),
            ].join('\n\n');
          })()}
        />
        <FormField
          control={form.control}
          name="file"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t(
                  allowedFileTypes.map((t) => t.toUpperCase()).join(' or ') +
                    ' file',
                )}
              </FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept={allowedFileTypes.map((t) => `.${t}`).join(',')}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    field.onChange(file);
                    setColumnNamesInCsv([]);
                    if (
                      fileUtils.getExtension(file.name) !== 'csv' ||
                      !tableId ||
                      !tableStore
                    ) {
                      return;
                    }

                    const { data: rows, error } = await tryCatch(() =>
                      fileUtils.parseCsv(file),
                    );
                    if (error) {
                      return;
                    }
                    setColumnNamesInCsv(rows[0] ?? []);
                  }}
                />
              </FormControl>
              <FormMessage />
              {showTemplateDocsLink && (
                <a
                  href={TABLE_TEMPLATE_DOCS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-accent-11 underline"
                >
                  {t('See the template format')}
                </a>
              )}
            </FormItem>
          )}
        />

        {fileType === 'csv' && columnNamesInCsv.length > 0 && tableStore && (
          <ScrollArea className="max-h-[calc(100vh-500px)] overflow-y-auto flex-1">
            <FormField
              control={form.control}
              name="fieldsMapping"
              key={file?.name}
              render={({ field }) => (
                <FormItem>
                  <FieldsMappingControl
                    fields={tableStore.getState().serverFields}
                    csvColumns={columnNamesInCsv}
                    onChange={field.onChange}
                  />
                </FormItem>
              )}
            />
          </ScrollArea>
        )}

        {serverError && (
          <div className=" flex items-center justify-between">
            <div className="text-danger-11">
              {t(
                'An unexpected error occurred while importing the file, please hit the copy error and send it to support',
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              {t('Cancel')}
            </Button>
          </DialogClose>
          <Button type="submit" size="sm" loading={isLoading}>
            {t('Import')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

async function readJsonTemplate(file: File): Promise<SharedTemplate | null> {
  const text = await file.text();
  const { data: content, error } = tryCatchSync(() => JSON.parse(text));
  if (error || typeof content !== 'object' || content === null) {
    return null;
  }
  if (Array.isArray(content.tables)) {
    return content;
  }
  return {
    name: content.name,
    type: content.type,
    summary: '',
    description: '',
    tags: [],
    blogUrl: null,
    metadata: null,
    author: '',
    categories: [],
    pieces: [],
    tables: [content],
    status: content.status,
  };
}

const TABLE_TEMPLATE_DOCS_URL =
  'https://www.activepieces.com/docs/tables/import-export#importing-a-json-template';

ImportTableDialog.displayName = 'ImportTableDialog';
export { ImportTableDialog };

type ImportTableFormProps = {
  tableId?: string;
  folderId?: string;
  onImportSuccess?: (result: { importedRecordsCount: number }) => void;
};

type ImportTableDialogProps = ImportTableFormProps & {
  open?: boolean;
  setIsOpen?: (open: boolean) => void;
  showTrigger?: boolean;
};

type ImportResult = {
  tableId: string;
  importedRecordsCount: number;
};

type ImportTableFormValues = {
  file: File;
  fieldsMapping: FieldsMapping;
};
