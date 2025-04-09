import { useMutation } from '@tanstack/react-query'
import { t } from 'i18next'
import { LogInIcon } from 'lucide-react'
import { useState } from 'react'
import { FieldErrors, useForm } from 'react-hook-form'

import { ApMarkdown } from '@/components/custom/markdown'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { CopyButton } from '@/components/ui/copy-button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { flagsHooks } from '@/hooks/flags-hooks'
import { api } from '@/lib/api'
import { ApFlagId } from '@activepieces/shared'

import { recordsApi } from '../lib/records-api'

import { useTableState } from './ap-table-state-provider'

const ImportCsvDialog = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [tableId, setRecords] = useTableState((state) => [state.table.id, state.setRecords])
  const { data: maxFileSize } = flagsHooks.useFlag<number>(ApFlagId.MAX_FILE_SIZE_MB)
  const { data: maxRecords } = flagsHooks.useFlag<number>(ApFlagId.MAX_RECORDS_PER_TABLE)
  const [serverError, setServerError] = useState<string | null>(null)
  const form = useForm<{
    file: File
    skipFirstRow: boolean
  }>({
    defaultValues: {
      skipFirstRow: false,
    },
    resolver: (values) => {
      const errors: FieldErrors<{
        file: File | null
        skipFirstRow: boolean
      }> = {}
      if (!values.file) {
        errors.file = {
          message: t('Please select a csv file'),
          type: 'required',
        }
      }
      if (maxFileSize && values.file.size > maxFileSize * 1024 * 1024) {
        errors.file = {
          message: `${t('Max file size is {maxFileSize}MB', {
            maxFileSize: maxFileSize,
          })}`,
          type: 'maxSize',
        }
      }
      return {
        values: Object.keys(errors).length === 0 ? values : {},
        errors,
      }
    },
  })

  const { mutate: importCsv, isPending: isLoading } = useMutation({
    mutationFn: async (data: { file: File; skipFirstRow: boolean }) => {
      setServerError(null)
      await recordsApi.importCsv({
        tableId,
        ...data,
      })
      const records = await recordsApi.list({
        tableId,
        cursor: undefined,
      })
      setRecords(records.data)
    },
    onSuccess: async () => {
      setIsOpen(false)
    },
    onError: (error) => {
      if (api.isError(error) && error.response?.data) {
        setServerError(JSON.stringify(error.response.data))
      } else {
        setServerError(error.message)
      }
    },
  })

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
          <form onSubmit={form.handleSubmit((data) => importCsv(data))} className="space-y-4">
            <ApMarkdown
              markdown={`${t('Any extra fields in the csv will be ignored')} \n
                       ${t('Any records after the limit ({maxRecords} records) will be ignored', {
                         maxRecords: maxRecords ?? 0,
                       })}
                    `}
            />
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('CSV File')}</FormLabel>
                  <FormControl>
                    <Input type="file" accept=".csv" onChange={(e) => field.onChange(e.target.files?.[0])} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="skipFirstRow"
              render={({ field }) => (
                <FormItem className="flex gap-2 items-center">
                  <FormControl>
                    <Checkbox onCheckedChange={(e) => field.onChange(e)} checked={field.value} />
                  </FormControl>
                  <FormLabel>{t('Skip first row')}</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />

            {serverError && (
              <div className=" flex items-center justify-between">
                {' '}
                <div className="text-red-500">
                  {t(
                    'An unexpected error occurred while importing the csv file, please hit the copy error and send it to support',
                  )}
                </div>
                <div className="min-w-4">
                  <CopyButton variant="ghost" withoutTooltip={true} textToCopy={serverError} />
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
  )
}

ImportCsvDialog.displayName = 'ImportCsvDialog'
export { ImportCsvDialog }
