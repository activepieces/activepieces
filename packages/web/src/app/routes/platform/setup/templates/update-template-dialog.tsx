import {
  FlowVersionTemplate,
  TemplateTag as TemplateTagType,
  Template,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { FileInput } from '@/components/custom/file-input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { templateUtils } from '@/features/flows';
import { templatesApi } from '@/features/templates';
import { api } from '@/lib/api';

const UpdateFlowTemplateSchema = z.object({
  displayName: z.string().min(1, t('Name is required')),
  summary: z.string(),
  description: z.string(),
  blogUrl: z.string(),
  template: z.unknown().optional(),
  tags: z.array(TemplateTagType).optional(),
  categories: z.array(z.string()).optional(),
});
type UpdateFlowTemplateSchema = z.infer<typeof UpdateFlowTemplateSchema>;

export const UpdateTemplateDialog = ({
  open,
  onOpenChange: setOpen,
  onDone,
  template,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
  template: Template;
}) => {
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Edit template')}</DialogTitle>
          <DialogDescription>
            {t(
              'Changes reach builders the next time they open the template gallery.',
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
                  <Label htmlFor="template">
                    {t('Replace flow file (optional)')}
                  </Label>
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
            {t('Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
