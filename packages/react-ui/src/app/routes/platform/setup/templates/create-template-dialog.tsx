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
import { templateUtils } from '@/features/flows/lib/template-parser';
import { templatesApi } from '@/features/templates/lib/templates-api';
import { userHooks } from '@/hooks/user-hooks';
import { api } from '@/lib/api';
import {
  TemplateTag as TemplateTagType,
  TemplateCategory,
  FlowVersionTemplate,
  TemplateType,
} from '@activepieces/shared';

import { Textarea } from '../../../../../components/ui/textarea';

const CreateFlowTemplateSchema = Type.Object({
  displayName: Type.String({
    minLength: 1,
    errorMessage: t('Name is required'),
  }),
  summary: Type.String(),
  description: Type.String(),
  blogUrl: Type.String(),
  template: FlowVersionTemplate,
  tags: Type.Optional(Type.Array(TemplateTagType)),
  categories: Type.Optional(Type.Array(Type.Enum(TemplateCategory))),
});
type CreateFlowTemplateSchema = Static<typeof CreateFlowTemplateSchema>;

export const CreateTemplateDialog = ({
  children,
  onDone,
}: {
  children: React.ReactNode;
  onDone: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const { data: currentUser } = userHooks.useCurrentUser();
  const form = useForm<CreateFlowTemplateSchema>({
    defaultValues: {
      displayName: '',
      blogUrl: '',
      summary: '',
      description: '',
      tags: [],
      categories: [],
      template: undefined,
    },
    resolver: typeboxResolver(CreateFlowTemplateSchema),
  });

  const { mutate, isPending } = useMutation({
    mutationKey: ['create-template'],
    mutationFn: () => {
      const formValue = form.getValues();
      const author = currentUser
        ? `${currentUser.firstName} ${currentUser.lastName}`
        : 'Unknown User';

      const flowTemplate: FlowVersionTemplate = {
        ...formValue.template,
        displayName: formValue.displayName,
        valid: formValue.template.valid ?? true,
      };

      return templatesApi.create({
        flows: [flowTemplate],
        type: TemplateType.CUSTOM,
        name: formValue.displayName,
        summary: formValue.summary,
        description: formValue.description,
        tags: formValue.tags || [],
        blogUrl: formValue.blogUrl,
        metadata: null,
        author,
        categories: formValue.categories || [],
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
          <DialogTitle>{t('Create New Template')}</DialogTitle>
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
                  <Label htmlFor="template">
                    {t('Template')}
                    <span className="text-destructive-300">{' *'} </span>
                  </Label>
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
                    required
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
