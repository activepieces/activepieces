import { typeboxResolver } from '@hookform/resolvers/typebox';
import { DialogDescription, DialogTrigger } from '@radix-ui/react-dialog';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import React, { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { templatesApi } from '@/features/templates/lib/templates-api';
import { userHooks } from '@/hooks/user-hooks';
import { useNewWindow } from '@/lib/navigation-utils';
import { Template } from '@activepieces/shared';

const ShareTemplateSchema = Type.Object({
  description: Type.String(),
  blogUrl: Type.Optional(Type.String()),
  tags: Type.Optional(Type.Array(Type.String())),
});

type ShareTemplateSchema = Static<typeof ShareTemplateSchema>;

const ShareTemplateDialog: React.FC<{
  children: React.ReactNode;
  flowId: string;
  flowVersionId: string;
}> = ({ children, flowId, flowVersionId }) => {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const shareTemplateForm = useForm<ShareTemplateSchema>({
    resolver: typeboxResolver(ShareTemplateSchema),
  });
  const openNewIndow = useNewWindow();
  const { data: currentUser } = userHooks.useCurrentUser();
  const { mutate, isPending } = useMutation<
    Template,
    Error,
    { flowId: string; description: string }
  >({
    mutationFn: async () => {
      const template = await flowsApi.getTemplate(flowId, {
        versionId: flowVersionId,
      });

      const author = currentUser
        ? `${currentUser.firstName} ${currentUser.lastName}`
        : 'Unknown User';

      const flowTemplate = await templatesApi.create({
        name: template.name,
        description: shareTemplateForm.getValues().description,
        summary: template.summary,
        tags: template.tags,
        blogUrl: template.blogUrl ?? undefined,
        metadata: null,
        author,
        categories: template.categories,
        type: template.type,
        flows: template.flows,
      });

      return flowTemplate;
    },
    onSuccess: (data) => {
      openNewIndow(`/templates/${data.id}`);
      setIsShareDialogOpen(false);
    },
  });

  const onShareTemplateSubmit: SubmitHandler<{
    description: string;
  }> = (data) => {
    mutate({
      flowId,
      description: data.description,
    });
  };

  return (
    <Dialog
      open={isShareDialogOpen}
      onOpenChange={(open) => setIsShareDialogOpen(open)}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Share Template')}</DialogTitle>
          <DialogDescription className="flex flex-col gap-2">
            <span>
              {t(
                'Generate or update a template link for the current flow to easily share it with others.',
              )}
            </span>
            <span>
              {t(
                'The template will not have any credentials in connection fields, keeping sensitive information secure.',
              )}
            </span>
          </DialogDescription>
        </DialogHeader>
        <Form {...shareTemplateForm}>
          <form
            className="grid space-y-4"
            onSubmit={shareTemplateForm.handleSubmit(onShareTemplateSubmit)}
          >
            <FormField
              control={shareTemplateForm.control}
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
            {shareTemplateForm?.formState?.errors?.root?.serverError && (
              <FormMessage>
                {shareTemplateForm.formState.errors.root.serverError.message}
              </FormMessage>
            )}
            <Button loading={isPending}>{t('Confirm')}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export { ShareTemplateDialog };
