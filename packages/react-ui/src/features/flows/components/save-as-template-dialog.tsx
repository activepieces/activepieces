import { typeboxResolver } from '@hookform/resolvers/typebox';
import { DialogDescription, DialogTrigger } from '@radix-ui/react-dialog';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import React, { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Form, FormField, FormItem, FormMessage } from '../../../components/ui/form';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { INTERNAL_ERROR_TOAST, toast } from '../../../components/ui/use-toast';
import { flowsApi } from '../lib/flows-api';
import { templatesApi } from '../../templates/lib/templates-api';
import { FlowTemplate, FlowVersion, TemplateType } from '@activepieces/shared';

const SaveAsTemplateSchema = Type.Object({
  name: Type.String(),
  description: Type.String(),
  tags: Type.Optional(Type.Array(Type.String())),
});

type SaveAsTemplateSchema = Static<typeof SaveAsTemplateSchema>;

const SaveAsTemplateDialog: React.FC<{
  children: React.ReactNode;
  flowId: string;
  flowVersion: FlowVersion;
}> = ({ children, flowId, flowVersion }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const saveAsTemplateForm = useForm<SaveAsTemplateSchema>({
    resolver: typeboxResolver(SaveAsTemplateSchema),
    defaultValues: {
      name: flowVersion.displayName,
    },
  });

  const { mutate, isPending } = useMutation<
    FlowTemplate,
    Error,
    SaveAsTemplateSchema
  >({
    mutationFn: async (data) => {
      const template = await flowsApi.getTemplate(flowId, {
        versionId: flowVersion.id,
      });
      const flowTemplate = await templatesApi.create({
        description: data.description,
        type: TemplateType.PLATFORM,
        tags: data.tags || [],
        blogUrl: template.blogUrl || '',
        template: {
          ...flowVersion,
          displayName: data.name
        },
      });
      return flowTemplate;
    },
    onSuccess: () => {
      toast({
        title: t('Success'),
        description: t('Flow has been saved as a template'),
        duration: 3000,
      });
      setIsDialogOpen(false);
    },
    onError: () => toast(INTERNAL_ERROR_TOAST),
  });

  const onSubmit: SubmitHandler<SaveAsTemplateSchema> = (data) => {
    mutate(data);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={(open) => setIsDialogOpen(open)}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Save as Template')}</DialogTitle>
          <DialogDescription>
            {t('Save this flow as a template to reuse it later.')}
          </DialogDescription>
        </DialogHeader>
        <Form {...saveAsTemplateForm}>
          <form
            className="grid space-y-4"
            onSubmit={saveAsTemplateForm.handleSubmit(onSubmit)}
          >
            <FormField
              control={saveAsTemplateForm.control}
              name="name"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="name">{t('Name')}</Label>
                  <Input
                    {...field}
                    required
                    id="name"
                    placeholder={t('Template name')}
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={saveAsTemplateForm.control}
              name="description"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="description">{t('Description')}</Label>
                  <Input
                    {...field}
                    required
                    id="description"
                    placeholder={t('A short description of the template')}
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            {saveAsTemplateForm?.formState?.errors?.root?.serverError && (
              <FormMessage>
                {saveAsTemplateForm.formState.errors.root.serverError.message}
              </FormMessage>
            )}
            <Button loading={isPending}>{t('Save')}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export { SaveAsTemplateDialog };
