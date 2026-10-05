import {
  TemplateTag as TemplateTagType,
  FlowVersionTemplate,
  TemplateType,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { FileInput } from '@/components/custom/file-input';
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
import { templateUtils } from '@/features/flows';
import { templatesApi } from '@/features/templates';
import { userHooks } from '@/hooks/user-hooks';
import { api } from '@/lib/api';

import { Textarea } from '../../../../../components/ui/textarea';

const CreateFlowTemplateSchema = z.object({
  displayName: z.string().min(1, t('Name is required')),
  summary: z.string(),
  description: z.string(),
  blogUrl: z.string(),
  template: FlowVersionTemplate,
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
          <DialogTitle>{t('New template')}</DialogTitle>
          <DialogDescription>
            {t(
              'Upload a flow exported as JSON. Builders in every project can start from it.',
            )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => e.preventDefault()}
          >
            <FormField
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="name">{t('Name')}</Label>
                  <Input
                    {...field}
                    id="name"
                    placeholder={t('e.g. Refund alerts for finance')}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="summary">{t('Summary (optional)')}</Label>
                  <Input
                    {...field}
                    id="summary"
                    placeholder={t('One line shown under the name')}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="description"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="description">
                    {t('Description (optional)')}
                  </Label>
                  <Textarea
                    {...field}
                    id="description"
                    placeholder={t('What the flow does and what it needs')}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="blogUrl"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="blogUrl">{t('Blog URL (optional)')}</Label>
                  <Input {...field} id="blogUrl" placeholder="https://" />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="template"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="template">{t('Flow file')}</Label>
                  <FileInput
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
                    placeholder={t('Choose a .json file')}
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
            {t('Create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
