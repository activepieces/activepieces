import {
  FlowVersionTemplate,
  TemplateTag as TemplateTagType,
  Template,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { adminFeedback, adminLayout } from '@/app/components/admin';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { templatesApi } from '@/features/templates';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { mutationFeedback } from '@/lib/mutation-feedback';

import { readTemplateFile } from './read-template-file';

const UpdateFlowTemplateSchema = z.object({
  displayName: z.string().min(1, t('Name is required')),
  summary: z.string(),
  description: z.string(),
  blogUrl: z.string(),
  template: z
    .custom<FlowVersionTemplate>(
      (value) => FlowVersionTemplate.safeParse(value).success,
      { message: t('Template file is invalid') },
    )
    .optional(),
  tags: z.array(TemplateTagType).optional(),
  categories: z.array(z.string()).optional(),
});
type UpdateFlowTemplateSchema = z.infer<typeof UpdateFlowTemplateSchema>;

export const UpdateTemplateDialog = ({
  children,
  onDone,
  template,
}: {
  children: React.ReactNode;
  onDone: () => void;
  template: Template;
}) => {
  const [open, setOpen] = useState(false);
  const submitting = useRef(false);
  const form = useForm<UpdateFlowTemplateSchema>({
    defaultValues: {
      displayName: template.name,
      summary: template.summary || '',
      blogUrl: template.blogUrl || '',
      description: template.description,
      tags: template.tags || [],
      categories: template.categories || [],
      template: undefined,
    },
    resolver: zodResolver(UpdateFlowTemplateSchema),
  });

  const { mutate, isPending } = useMutation({
    mutationKey: ['update-template', template.id],
    mutationFn: (formValue: UpdateFlowTemplateSchema) => {
      return templatesApi.update(template.id, {
        name: formValue.displayName,
        summary: formValue.summary,
        description: formValue.description,
        tags: formValue.tags,
        blogUrl: formValue.blogUrl,
        metadata: template.metadata,
        categories: formValue.categories || [],
        flows: formValue.template
          ? [
              {
                ...formValue.template,
                displayName: formValue.displayName,
                valid: formValue.template.valid ?? true,
              },
            ]
          : undefined,
      });
    },
    onSuccess: (_, formValue) => {
      adminFeedback.done({
        verb: 'update',
        name: formValue.displayName,
      });
      onDone();
      close();
    },
    onError: (error) => {
      form.setError('root.serverError', {
        type: 'manual',
        message: mutationFeedback.message(error),
      });
    },
  });

  const close = () => {
    setOpen(false);
    form.reset();
  };

  const onSubmit = (formValue: UpdateFlowTemplateSchema) => {
    if (submitting.current) {
      return;
    }
    submitting.current = true;
    form.clearErrors('root.serverError');
    mutate(formValue, {
      onSettled: () => {
        submitting.current = false;
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setOpen(true);
        } else if (!isPending) {
          close();
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className={adminLayout.dialog.md}
        showCloseButton={!isPending}
      >
        <DialogHeader>
          <DialogTitle>{t('Update Template')}</DialogTitle>
          <DialogDescription>
            {t('Edit the template details or upload a new flow file.')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="grid space-y-4" onSubmit={(e) => e.preventDefault()}>
            <FormField
              name="displayName"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="name" showRequiredIndicator>
                    {t('Name')}
                  </Label>
                  <Input
                    {...field}
                    required
                    id="name"
                    placeholder={t('Template Name')}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="summary"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="summary">{t('Summary')}</Label>
                  <Input
                    {...field}
                    id="summary"
                    placeholder={t('Template Summary')}
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

                  <Textarea
                    {...field}
                    required
                    id="description"
                    placeholder={t('Template Description')}
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
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="template"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="template">{t('Template')}</Label>
                  <Input
                    type="file"
                    accept=".json"
                    onChange={(e) =>
                      readTemplateFile({
                        file: e.target.files?.[0],
                        onChange: field.onChange,
                        onInvalid: () =>
                          form.setError('template', {
                            message: t('Invalid JSON'),
                          }),
                      })
                    }
                    id="template"
                    placeholder={t('Template')}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.formState.errors.root?.serverError && (
              <FormMessage>
                {form.formState.errors.root.serverError.message}
              </FormMessage>
            )}
          </form>
        </Form>
        <DialogFooter>
          <Button
            variant={'outline'}
            disabled={isPending}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              close();
            }}
          >
            {t('Cancel')}
          </Button>
          <Button
            {...adminControl(AdminControl.TEMPLATES_EDIT_SUBMIT)}
            disabled={isPending}
            loading={isPending}
            onClick={(e) => {
              form.handleSubmit(onSubmit)(e);
            }}
          >
            {t('Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
