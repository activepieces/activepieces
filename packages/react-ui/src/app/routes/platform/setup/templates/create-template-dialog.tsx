import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  MultiSelect,
  MultiSelectTrigger,
  MultiSelectValue,
  MultiSelectContent,
  MultiSelectList,
  MultiSelectItem,
  MultiSelectSearch,
} from '@/components/custom/multi-select';
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
import { templatesApi } from '@/features/templates/lib/templates-api';
import { userHooks } from '@/hooks/user-hooks';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/utils';
import {
  TemplateTags,
  TemplateCategory,
  Template,
  FlowVersionTemplate,
  TemplateType,
} from '@activepieces/shared';

import { Textarea } from '../../../../../components/ui/textarea';

import { TemplateTag } from './template-tag';

const CreateFlowTemplateSchema = Type.Object({
  displayName: Type.String({
    minLength: 1,
    errorMessage: t('Name is required'),
  }),
  description: Type.String(),
  blogUrl: Type.String(),
  template: FlowVersionTemplate,
  tags: Type.Optional(Type.Array(TemplateTags)),
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
        : 'Someone in platform';

      const flowTemplate: FlowVersionTemplate = {
        ...formValue.template,
        displayName: formValue.displayName,
        valid: formValue.template.valid ?? true,
      };

      console.log('flowTemplate', flowTemplate);

      return templatesApi.create({
        collection: {
          flowTemplates: [flowTemplate],
        },
        type: TemplateType.CUSTOM,
        name: formValue.displayName,
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
                          try {
                            const flowTemplate = JSON.parse(text)
                              .template as FlowVersionTemplate;
                            field.onChange(flowTemplate);
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
                  <TemplateTag
                    onChange={(tags) => field.onChange(tags)}
                    value={field.value}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="categories"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="categories">{t('Categories')}</Label>
                  <MultiSelect
                    modal={true}
                    value={(field.value as string[]) || []}
                    onValueChange={(value) =>
                      field.onChange(value as TemplateCategory[])
                    }
                  >
                    <MultiSelectTrigger>
                      <MultiSelectValue placeholder={t('Select categories')} />
                    </MultiSelectTrigger>
                    <MultiSelectContent>
                      <MultiSelectSearch
                        placeholder={t('Search categories...')}
                      />
                      <MultiSelectList>
                        {Object.values(TemplateCategory).map((category) => (
                          <MultiSelectItem key={category} value={category}>
                            {formatUtils.convertEnumToHumanReadable(category)}
                          </MultiSelectItem>
                        ))}
                      </MultiSelectList>
                    </MultiSelectContent>
                  </MultiSelect>
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
