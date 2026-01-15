import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Import } from 'lucide-react';
import { useState } from 'react';
import { FieldErrors, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

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
import { flagsHooks } from '@/hooks/flags-hooks';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { ApFlagId, SharedTemplate, TableTemplate } from '@activepieces/shared';

import { tableHooks } from '../lib/table-hooks';

type ImportTableDialogProps = {
  open?: boolean;
  setIsOpen?: (open: boolean) => void;
  showTrigger?: boolean;
  tableId?: string;
  onImportSuccess?: () => void;
};

const ImportTableDialog = ({
  open,
  setIsOpen,
  showTrigger = true,
  tableId,
  onImportSuccess,
}: ImportTableDialogProps) => {
  const navigate = useNavigate();
  const projectId = authenticationSession.getProjectId() ?? '';
  const [serverError, setServerError] = useState<string | null>(null);
  const { data: maxFileSize } = flagsHooks.useFlag<number>(
    ApFlagId.MAX_FILE_SIZE_MB,
  );
  const { data: maxRecords } = flagsHooks.useFlag<number>(
    ApFlagId.MAX_RECORDS_PER_TABLE,
  );

  const form = useForm<{
    file: File;
  }>({
    defaultValues: {},
    resolver: (values) => {
      const errors: FieldErrors<{
        file: File | null;
      }> = {};
      if (!values.file) {
        errors.file = {
          message: t('Please select a json file'),
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

  const { mutate: importTable, isPending: isLoading } = useMutation({
    mutationFn: async (data: { file: File }) => {
      setServerError(null);

      const fileContent = await data.file.text();
      const parsedContent = JSON.parse(fileContent);

      let template: SharedTemplate;
      if ('tables' in parsedContent && Array.isArray(parsedContent.tables)) {
        template = parsedContent as SharedTemplate;
      } else {
        // Convert single table template to SharedTemplate format
        const singleTableTemplate = parsedContent as TableTemplate;
        template = {
          name: singleTableTemplate.name,
          type: parsedContent.type,
          summary: '',
          description: '',
          tags: [],
          blogUrl: null,
          metadata: null,
          author: '',
          categories: [],
          pieces: [],
          tables: [singleTableTemplate],
          status: parsedContent.status,
        };
      }

      if (!template.tables || template.tables.length === 0) {
        throw new Error('No tables found in template');
      }

      if (tableId) {
        // Import into existing table
        return await tableHooks.importTableIntoExisting({
          template,
          existingTableId: tableId,
          maxRecords: maxRecords ?? 1000,
        });
      } else {
        // Import all tables from template
        const tables = await tableHooks.importTablesFromTemplates({
          templates: [template],
          projectId,
          maxRecords: maxRecords ?? 1000,
        });
        return tables[0];
      }
    },
    onSuccess: async (table) => {
      if (setIsOpen) {
        setIsOpen(false);
      }
      if (onImportSuccess) {
        onImportSuccess();
      }
      if (!tableId) {
        navigate(`/projects/${projectId}/tables/${table.id}`);
      }
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
        if (setIsOpen) {
          setIsOpen(value);
        }
        form.reset();
      }}
    >
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

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => importTable(data))}
            className="space-y-4"
          >
            <ApMarkdown
              className="text-left"
              markdown={`
${t('Import a table template from a JSON file')}

${
  tableId
    ? t(
        '⚠️ **Warning:** This will completely replace the current table, deleting all existing fields and records',
      )
    : t('The table will be created with all its fields and data')
}

${t('Any records after the limit ({maxRecords} records) will be ignored', {
  maxRecords: maxRecords ?? 0,
})}`}
            />
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('JSON File')}</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept=".json"
                      onChange={async (e) => {
                        field.onChange(e.target.files?.[0]);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {serverError && (
              <div className=" flex items-center justify-between">
                <div className="text-red-500">
                  {t(
                    'An unexpected error occurred while importing the table, please hit the copy error and send it to support',
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

ImportTableDialog.displayName = 'ImportTableDialog';
export { ImportTableDialog };
