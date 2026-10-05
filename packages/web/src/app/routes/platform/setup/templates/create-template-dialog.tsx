import {
  formErrors,
  TemplateTag as TemplateTagType,
  FlowVersionTemplate,
  TemplateType,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Textarea } from '@/components/ui/textarea';
import { templateUtils } from '@/features/flows';
import { templatesMutations } from '@/features/templates';
import { userHooks } from '@/hooks/user-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { mutationFeedback } from '@/lib/mutation-feedback';

export const CreateTemplateDialog = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
        <CreateTemplateForm
          key={open ? 'open' : 'closed'}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

function CreateTemplateForm({ onClose }: { onClose: () => void }) {
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
    mode: 'onChange',
    resolver: zodResolver(CreateFlowTemplateSchema),
  });

  const { mutate: createTemplate, isPending } =
    templatesMutations.useCreateTemplate({
      onError: (error) => {
        mutationFeedback.markShown(error);
        form.setError('root.serverError', {
          type: 'manual',
          message: mutationFeedback.message(error),
        });
      },
    });

  const onSubmit = (values: CreateFlowTemplateSchema) => {
    if (isPending || !values.template) {
      return;
    }
    form.clearErrors('root.serverError');
    const author = currentUser
      ? `${currentUser.firstName} ${currentUser.lastName}`.trim()
      : '';
    createTemplate(
      {
        flows: [
          {
            ...values.template,
            displayName: values.displayName,
            valid: values.template.valid ?? true,
          },
        ],
        type: TemplateType.CUSTOM,
        name: values.displayName,
        summary: values.summary,
        description: values.description,
        tags: values.tags ?? [],
        blogUrl: values.blogUrl,
        metadata: null,
        author,
        categories: values.categories ?? [],
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
                autoFocus
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
              <Label htmlFor="template">{t('Flow file')}</Label>
              <FileInput
                accept=".json"
                onChange={(event) =>
                  readFlowFile({
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
            {...adminControl(AdminControl.TEMPLATES_NEW_SUBMIT)}
            type="submit"
            disabled={!form.formState.isValid}
            loading={isPending}
          >
            {t('Create')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function readFlowFile({
  file,
  onFlow,
  onInvalid,
}: {
  file: File | undefined;
  onFlow: (flow: FlowVersionTemplate) => void;
  onInvalid: () => void;
}): void {
  if (!file) {
    return;
  }
  file
    .text()
    .then((text) => {
      const flow = templateUtils.extractFlow(text);
      if (flow) {
        onFlow(flow);
        return;
      }
      onInvalid();
    })
    .catch(onInvalid);
}

const CreateFlowTemplateSchema = z.object({
  displayName: z.string().trim().min(1, formErrors.required),
  summary: z.string(),
  description: z.string(),
  blogUrl: z.string(),
  template: FlowVersionTemplate.optional().refine(
    (template) => template !== undefined,
    { message: formErrors.required },
  ),
  tags: z.array(TemplateTagType).optional(),
  categories: z.array(z.string()).optional(),
});

type CreateFlowTemplateSchema = z.infer<typeof CreateFlowTemplateSchema>;

export const templateFileUtils = { readFlowFile };
