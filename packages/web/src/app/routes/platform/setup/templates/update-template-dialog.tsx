import {
  formErrors,
  FlowVersionTemplate,
  TemplateTag as TemplateTagType,
  Template,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { templatesMutations } from '@/features/templates';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { mutationFeedback } from '@/lib/mutation-feedback';

import { templateFileUtils } from './create-template-dialog';

export const UpdateTemplateDialog = ({
  open,
  onOpenChange,
  template,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{t('Edit template')}</DialogTitle>
        <DialogDescription>
          {t(
            'Changes reach builders the next time they open the template gallery.',
          )}
        </DialogDescription>
      </DialogHeader>
      <UpdateTemplateForm
        key={open ? template.id : 'closed'}
        template={template}
        onClose={() => onOpenChange(false)}
      />
    </DialogContent>
  </Dialog>
);

function UpdateTemplateForm({
  template,
  onClose,
}: {
  template: Template;
  onClose: () => void;
}) {
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
    mode: 'onChange',
    resolver: zodResolver(UpdateFlowTemplateSchema),
  });

  const { mutate: updateTemplate, isPending } =
    templatesMutations.useUpdateTemplate({
      onError: (error) => {
        mutationFeedback.markShown(error);
        form.setError('root.serverError', {
          type: 'manual',
          message: mutationFeedback.message(error),
        });
      },
    });

  const onSubmit = (values: UpdateFlowTemplateSchema) => {
    if (isPending || !form.formState.isDirty) {
      return;
    }
    form.clearErrors('root.serverError');
    updateTemplate(
      {
        templateId: template.id,
        request: {
          name: values.displayName,
          summary: values.summary,
          description: values.description,
          tags: values.tags,
          blogUrl: values.blogUrl,
          metadata: template.metadata,
          categories: values.categories || [],
          flows: values.template
            ? [
                {
                  ...values.template,
                  displayName: values.displayName,
                  valid: values.template.valid ?? true,
                },
              ]
            : undefined,
        },
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(onSubmit)}
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
              <Label htmlFor="description">{t('Description (optional)')}</Label>
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
                onChange={(event) =>
                  templateFileUtils.readFlowFile({
                    file: event.target.files?.[0],
                    onFlow: (flow) =>
                      form.setValue('template', flow, {
                        shouldDirty: true,
                        shouldValidate: true,
                      }),
                    onInvalid: () =>
                      form.setError('template', {
                        message: t('Invalid JSON'),
                      }),
                  })
                }
                id="template"
                name={field.name}
                placeholder={t('Choose a .json file')}
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
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button
            {...adminControl(AdminControl.TEMPLATES_EDIT_SUBMIT)}
            type="submit"
            disabled={!form.formState.isDirty || !form.formState.isValid}
            loading={isPending}
          >
            {t('Save')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

const UpdateFlowTemplateSchema = z.object({
  displayName: z.string().trim().min(1, formErrors.required),
  summary: z.string(),
  description: z.string(),
  blogUrl: z.string(),
  template: FlowVersionTemplate.optional(),
  tags: z.array(TemplateTagType).optional(),
  categories: z.array(z.string()).optional(),
});

type UpdateFlowTemplateSchema = z.infer<typeof UpdateFlowTemplateSchema>;
