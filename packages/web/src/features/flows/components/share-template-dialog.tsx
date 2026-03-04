import { Template } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import React, { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { flowsApi } from '@/features/flows/api/flows-api';
import { templatesApi } from '@/features/templates/api/templates-api';
import { userHooks } from '@/hooks/user-hooks';
import { useNewWindow } from '@/lib/navigation-utils';

const ShareTemplateSchema = z.object({
  description: z.string(),
  blogUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type ShareTemplateSchema = z.infer<typeof ShareTemplateSchema>;

const ShareTemplateDialog: React.FC<{
  children: React.ReactNode;
  flowId: string;
  flowVersionId: string;
}> = ({ children, flowId, flowVersionId }) => {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const shareTemplateForm = useForm<ShareTemplateSchema>({
    resolver: zodResolver(ShareTemplateSchema),
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
        metadata: template.metadata,
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
