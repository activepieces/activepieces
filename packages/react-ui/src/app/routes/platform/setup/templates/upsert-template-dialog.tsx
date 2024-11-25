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
import { TagInput } from '@/components/ui/tag-input';
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { templatesApi } from '@/features/templates/lib/templates-api';
import { CreateFlowTemplateRequest } from '@activepieces/ee-shared';
import {
  FlowTemplate,
  FlowVersionTemplate,
  TemplateType,
} from '@activepieces/shared';

import { Textarea } from '../../../../../components/ui/textarea';

const UpsertFlowTemplateSchema = Type.Object({
  displayName: Type.String({
    minLength: 1,
    errorMessage: t('Name is required'),
  }),
  description: Type.String(),
  blogUrl: Type.String(),
  template: FlowVersionTemplate,
  tags: Type.Optional(Type.Array(Type.String())),
});
type UpsertFlowTemplateSchema = Static<typeof UpsertFlowTemplateSchema>;
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
  const form = useForm<UpsertFlowTemplateSchema>({
    defaultValues: {
      displayName: template?.template.displayName || '',
      blogUrl: template?.blogUrl || '',
      description: template?.description || '',
      tags: template?.tags || [],
      template: template?.template,
    },
    resolver: typeboxResolver(UpsertFlowTemplateSchema),
  });

  const { toast } = useToast();

  const { mutate, isPending } = useMutation({
    mutationKey: ['create-template'],
    mutationFn: () => {
      const formValue = form.getValues();
      return templatesApi.create({
        template: {
          ...formValue.template,
          displayName: formValue.displayName,
          valid: formValue.template.valid ?? true,
        },
        type: TemplateType.PLATFORM,
        blogUrl: formValue.blogUrl,
        description: formValue.description,
        id: template?.id,
        tags: formValue.tags,
      });
    },
    onSuccess: () => {
      onDone();
      setOpen(false);
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
      setOpen(false);
    },
  });

  const onSubmit = () => {
    if (!form.getValues().template) {
      form.setError('template', {
        message: t('Template is required'),
      });
      return;
    }

    mutate();
  };

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
          <DialogTitle>
            {template ? t('Update New Template') : t('Create New Template')}
          </DialogTitle>
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
                  <Label htmlFor="template">
                    {t('Template')}
                    {!template && (
                      <span className="text-destructive-300">{' *'} </span>
                    )}
                  </Label>
                  <Input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      e.target.files &&
                        e.target.files[0].text().then((text) => {
                          try {
                            const json = JSON.parse(text) as FlowTemplate;
                            field.onChange(json.template);
                          } catch (e) {
                            form.setError('template', {
                              message: t('Invalid JSON'),
                            });
                          }
                        });
                    }}
                    required
                    id="template"
                    placeholder={t('Template')}
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
