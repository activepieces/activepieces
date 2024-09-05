import { typeboxResolver } from '@hookform/resolvers/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormMessage, useFormField } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { proxyConfigApi } from '@/lib/proxy-config-api';
import { Type } from '@sinclair/typebox';
import { AiProviders, ProxyConfig } from '../../../../../../shared/src';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type UpsertAIProviderDialogProps = {
  config?: ProxyConfig;
  children: React.ReactNode;
  onCreate: () => void;
};

export const UpsertAIProviderDialog = ({
  children,
  onCreate,
  config
}: UpsertAIProviderDialogProps) => {
  const [open, setOpen] = useState(false);
  const form = useForm<ProxyConfig>({
    resolver: typeboxResolver(Type.Composite([
      Type.Omit(ProxyConfig, ['id', 'created', 'updated', 'platformId']),
      Type.Object({
        defaultHeaders: Type.Record(Type.String(), Type.String()),
      }, { default: { defaultHeaders: {} } }),
    ])),
    defaultValues: config,
  });

  const formState = form.watch()

  const newHeaderForm = useForm({
    resolver: typeboxResolver(Type.Object({
      name: Type.String({ maxLength: 1 }),
    })),
  })

  const [isNewHeaderFormOpen, setIsNewHeaderFormOpen] = useState(false);

  const { toast } = useToast();

  const { mutate, isPending } = useMutation({
    mutationKey: ['upsert-proxy-config'],
    mutationFn: async () => {
      const formValues = form.getValues();
      if (config) {
        await proxyConfigApi.update(config.id, formValues)
      } else {
        await proxyConfigApi.create(formValues)
      }
    },
    onSuccess: () => {
      onCreate();
      form.reset();
      setOpen(false);
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
      form.reset();
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={(open) => setOpen(open)}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Create New AI Provider')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="grid space-y-4" onSubmit={(e) => e.preventDefault()}>
            <FormField
              name="provider"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="provider">{t('AI Provider')}</Label>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={Boolean(config)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('Select AI Provider')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {AiProviders.map(p => <SelectItem value={p.value}>{p.label}</SelectItem>)}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="baseUrl"
              render={({ field }) => (
                <FormItem className="grid space-y-2" itemType='url'>
                  <Label htmlFor="baseUrl">{t('Base URL')}</Label>
                  <Input
                    {...field}
                    required
                    type="url"
                    id="baseUrl"
                    placeholder={t('Base URL')}
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='flex gap-1 items-center'>
              <h2 className="text-lg font-bold">{t('Default Headers')}</h2>
              <Popover open={isNewHeaderFormOpen} onOpenChange={setIsNewHeaderFormOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Plus className='w-4 h-4' />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-4" align="start">
                  <Form {...newHeaderForm}>
                    <form className="grid space-y-4" onSubmit={(e) => e.preventDefault()}>
                      <FormField
                        name="name"
                        render={({ field }) => (
                          <FormItem className="grid space-y-3">
                            <Label htmlFor="name">{t('Add New Header')}</Label>
                            <div className='flex gap-2 items-center justify-center'>
                              <Input
                                {...field}
                                required
                                id="name"
                                placeholder={t('Name')}
                                className="rounded-sm"
                              />
                              <Button onClick={(e) => {
                                if (Object.hasOwn(formState.defaultHeaders ?? {}, field.value)) {
                                  newHeaderForm.setError('root.serverError', {
                                    message: t('Header already exists'),
                                  })
                                  return
                                }
                                if (field.value.trim().length === 0) {
                                  newHeaderForm.setError('root.serverError', {
                                    message: t('Please enter a name'),
                                  })
                                  return
                                }
                                form.setValue(`defaultHeaders.${field.value}`, '')
                                newHeaderForm.resetField('name')
                                setIsNewHeaderFormOpen(false)
                              }}>
                                {t('Add')}
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {newHeaderForm?.formState?.errors?.root?.serverError && (
                        <FormMessage>
                          {newHeaderForm.formState.errors.root.serverError.message}
                        </FormMessage>
                      )}
                    </form>
                  </Form>
                </PopoverContent>
              </Popover>
            </div>
            {Object.entries(formState.defaultHeaders ?? {}).map(([key, value]) => (
              <div className='w-full' key={`header-${key}`}>
                <FormField
                  key={key}
                  name={`defaultHeaders.${key}`}
                  render={({ field }) => (
                    <FormItem className="grid space-y-2">
                      <Label htmlFor={key} className='font-mono'>{key.toUpperCase()}</Label>
                      <div className='flex gap-2 items-center justify-center'>
                        <Input
                          {...field}
                          required
                          id={key}
                          placeholder={key}
                          className="rounded-sm"
                        />
                        <Button variant="ghost" color='destructive' size="sm" onClick={() => {
                          form.unregister(`defaultHeaders.${key}`)
                        }}>
                          <Trash className='w-4 h-4' color='red' />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
            {form?.formState?.errors?.root?.serverError && (
              <FormMessage>
                {form.formState.errors.root.serverError.message}
              </FormMessage>
            )}
          </form>
        </Form>
        <DialogFooter>
          <Button
            variant={'outline'}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setOpen(false);
            }}
          >
            {t('Cancel')}
          </Button>
          <Button
            disabled={isPending || !form.formState.isValid}
            loading={isPending}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              mutate();
            }}
          >
            {t('Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
