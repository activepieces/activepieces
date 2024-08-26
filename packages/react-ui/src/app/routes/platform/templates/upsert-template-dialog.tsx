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
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TagInput } from '@/components/ui/tag-input';
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { templatesApi } from '@/features/templates/lib/templates-api';
import { CreateFlowTemplateRequest } from '@activepieces/ee-shared';
import { FlowTemplate, TemplateType } from '@activepieces/shared';

export const UpsertTemplateDialog = ({
  children,
  onDone,
  template,
}: {
  children: React.ReactNode;
  onDone: () => void;
  template?: CreateFlowTemplateRequest;
}) => {
  const [open, setOpen] = useState(false);
  const form = useForm<CreateFlowTemplateRequest>({
    defaultValues: {
      ...template,
      type: TemplateType.PLATFORM,
    },
    resolver: typeboxResolver(CreateFlowTemplateRequest),
  });

  const { toast } = useToast();

  const { mutate, isPending } = useMutation({
    mutationKey: ['create-template'],
    mutationFn: () => templatesApi.create(form.getValues()),
    onSuccess: () => {
      onDone();
      setOpen(false);
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
      setOpen(false);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        form.reset();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Create New Template')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="grid space-y-4" onSubmit={(e) => e.preventDefault()}>
            <FormField
              name="template.displayName"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="name">{t('Name')}</Label>
                  <Input
                    {...field}
                    required
                    id="name"
                    placeholder={t('Template Name')}
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="description"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="description">{t('Description')}</Label>
                  <Input
                    {...field}
                    required
                    id="description"
                    placeholder={t('Template Description')}
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="blogUrl"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="blogUrl">{t('Blog URL')}</Label>
                  <Input
                    {...field}
                    required
                    id="blogUrl"
                    placeholder={t('Template Blog URL')}
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="template"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="flow">{t('Flow')}</Label>
                  <Input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      e.target.files &&
                        e.target.files[0].text().then((text) => {
                          const json = JSON.parse(text) as FlowTemplate;
                          json.template.displayName =
                            form.getValues().template.displayName;
                          field.onChange(json.template);
                          console.log(json.template);
                        });
                    }}
                    required
                    id="flow"
                    placeholder={t('Template Flow')}
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="tags"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="tags">{t('Tags')}</Label>
                  <TagInput
                    onChange={(tags) => field.onChange(tags)}
                    value={field.value}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
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
