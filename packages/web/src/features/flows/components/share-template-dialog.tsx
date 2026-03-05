import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { t } from 'i18next';
import React, { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

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
import { userHooks } from '@/hooks/user-hooks';
import { useNewWindow } from '@/lib/navigation-utils';

import { flowHooks } from '../hooks/flow-hooks';

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
  const { mutate, isPending } = flowHooks.useCreateTemplateFromFlow({
    onSuccess: (data) => {
      openNewIndow(`/templates/${data.id}`);
      setIsShareDialogOpen(false);
    },
  });

  const onShareTemplateSubmit: SubmitHandler<{
    description: string;
  }> = (data) => {
    const author = currentUser
      ? `${currentUser.firstName} ${currentUser.lastName}`
      : 'Unknown User';
    mutate({
      flowId,
      flowVersionId,
      description: data.description,
      author,
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
            <Button loading={isPending}>{t('Share')}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export { ShareTemplateDialog };
