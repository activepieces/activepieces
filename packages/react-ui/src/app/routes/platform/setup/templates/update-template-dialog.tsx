import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
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
import { Textarea } from '@/components/ui/textarea';
import { templateUtils } from '@/features/flows/lib/template-parser';
import { templatesApi } from '@/features/templates/lib/templates-api';
import { api } from '@/lib/api';
import {
  FlowVersionTemplate,
  TemplateTag as TemplateTagType,
  TemplateCategory,
  Template,
} from '@activepieces/shared';

const UpdateFlowTemplateSchema = Type.Object({
  displayName: Type.String({
    minLength: 1,
    errorMessage: t('Name is required'),
  }),
  summary: Type.String(),
  description: Type.String(),
  blogUrl: Type.String(),
  template: Type.Optional(Type.Unknown()),
  tags: Type.Optional(Type.Array(TemplateTagType)),
  categories: Type.Optional(Type.Array(Type.Enum(TemplateCategory))),
});
type UpdateFlowTemplateSchema = Static<typeof UpdateFlowTemplateSchema>;

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
    resolver: typeboxResolver(UpdateFlowTemplateSchema),
  });

  const { mutate, isPending } = useMutation({
    mutationKey: ['update-template', template.id],
    mutationFn: () => {
      const formValue = form.getValues();

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
                ...(formValue.template as FlowVersionTemplate),
                displayName: formValue.displayName,
                valid:
                  (formValue.template as FlowVersionTemplate).valid ?? true,
              },
            ]
          : undefined,
      });
    },
    onSuccess: () => {
      onDone();
      setOpen(false);
    },
    onError: (error) => {
      if (api.isError(error)) {
        form.setError('template', {
          message: error.message,
        });
      }
    },
  });

  const onSubmit = () => {
    mutate();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        if (!open) {
          form.reset();
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Update Template')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="grid space-y-4" onSubmit={(e) => e.preventDefault()}>
            <FormField
              name="displayName"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="name">
                    {t('Name')}{' '}
                    <span className="text-destructive-300">{'*'}</span>
                  </Label>
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
              name="summary"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="summary">{t('Summary')}</Label>
                  <Input
                    {...field}
                    id="summary"
                    placeholder={t('Template Summary')}
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

                  <Textarea
                    {...field}
                    required
                    id="description"
                    className="rounded-sm"
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
                  <Label htmlFor="template">{t('Template')}</Label>
                  <Input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      e.target.files &&
                        e.target.files[0].text().then((text) => {
                          const flowTemplate = templateUtils.extractFlow(text);
                          if (flowTemplate) {
                            field.onChange(flowTemplate);
                          } else {
                            form.setError('template', {
                              message: t('Invalid JSON'),
                            });
                          }
                        });
                    }}
                    id="template"
                    placeholder={t('Template')}
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
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
