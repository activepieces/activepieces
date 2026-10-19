import {
  TemplateTag as TemplateTagType,
  FlowVersionTemplate,
  TemplateType,
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
import { templatesApi } from '@/features/templates';
import { userHooks } from '@/hooks/user-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { mutationFeedback } from '@/lib/mutation-feedback';

import { Textarea } from '../../../../../components/ui/textarea';

import { readTemplateFile } from './read-template-file';

const CreateFlowTemplateSchema = z.object({
  displayName: z.string().min(1, t('Name is required')),
  summary: z.string(),
  description: z.string(),
  blogUrl: z.string(),
  template: z
    .custom<FlowVersionTemplate>((value) => value !== undefined, {
      message: t('Template is required'),
    })
    .refine((value) => FlowVersionTemplate.safeParse(value).success, {
      message: t('Template file is invalid'),
    }),
  tags: z.array(TemplateTagType).optional(),
  categories: z.array(z.string()).optional(),
});
type CreateFlowTemplateSchema = z.infer<typeof CreateFlowTemplateSchema>;

export const CreateTemplateDialog = ({
  children,
  onDone,
}: {
  children: React.ReactNode;
  onDone: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const submitting = useRef(false);
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
    resolver: zodResolver(CreateFlowTemplateSchema),
  });

  const close = () => {
    setOpen(false);
    form.reset();
  };

  const { mutate, isPending } = useMutation({
    mutationKey: ['create-template'],
    mutationFn: (formValue: CreateFlowTemplateSchema) => {
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
    onSuccess: (_, formValue) => {
      adminFeedback.done({
        verb: 'create',
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

  const onSubmit = (formValue: CreateFlowTemplateSchema) => {
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
          <DialogTitle>{t('Create New Template')}</DialogTitle>
          <DialogDescription>
            {t('Upload a flow template file and describe it.')}
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
                  <Label htmlFor="template" showRequiredIndicator>
                    {t('Template')}
                  </Label>
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
                    required
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
            {...adminControl(AdminControl.TEMPLATES_NEW_SUBMIT)}
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
