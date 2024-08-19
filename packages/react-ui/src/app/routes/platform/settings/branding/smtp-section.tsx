import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { platformHooks } from '@/hooks/platform-hooks';
import { platformApi } from '@/lib/platforms-api';
import { Mailbox } from 'lucide-react';
import { Card } from '@/components/ui/card';

const FromSchema = Type.Object({
  smtpHost: Type.String(),
  smtpPort: Type.Number(),
  smtpUser: Type.String(),
  smtpPassword: Type.String(),
  smtpSenderEmail: Type.String(),
  smtpUseSSL: Type.Boolean(),
});

type FromSchema = Static<typeof FromSchema>;

export const SmtpSection = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const form = useForm({
    defaultValues: {
      smtpHost: platform?.smtpHost,
      smtpPort: platform?.smtpPort,
      smtpUser: platform?.smtpUser,
      smtpPassword: platform?.smtpPassword,
      smtpSenderEmail: platform?.smtpSenderEmail,
      smtpUseSSL: platform?.smtpUseSSL,
    },
    resolver: typeboxResolver(FromSchema),
  });

  const { toast } = useToast();

  const { mutate: updatePlatform, isPending } = useMutation({
    mutationFn: async () =>
      platformApi.update(
        {
          smtpHost: form.getValues().smtpHost,
          smtpPort: form.getValues().smtpPort,
          smtpUser: form.getValues().smtpUser,
          smtpPassword: form.getValues().smtpPassword,
          smtpSenderEmail: form.getValues().smtpSenderEmail,
          smtpUseSSL: form.getValues().smtpUseSSL,
        },
        platform.id,
      ),
    onSuccess: () => {
      toast({
        title: t('Success'),
        description: t('Your changes have been saved.'),
        duration: 3000,
      });
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  return (
    <Card className="w-full px-4 py-4">
      <div className="flex w-full gap-2 justify-center items-center">
        <div className="flex flex-col gap-2 text-center mr-2">
          <Mailbox className="w-8 h-8" />
        </div>
        <div className="flex flex-grow  flex-col">
          <div className="text-md">Mail Server</div>
          <div className="text-sm text-muted-foreground">
            {t(
              'Configure SMTP settings for outgoing email',
            )}
          </div>
        </div>
        <div className="flex flex-col justify-center items-center">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant={'basic'}>{t('Configure')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('Mail Server')}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-1 mt-4">
                <Form {...form}>
                  <form
                    className="grid space-y-4"
                    onSubmit={(e) => e.preventDefault()}
                  >
                    <FormField
                      name="smtpHost"
                      render={({ field }) => (
                        <FormItem className="grid space-y-2">
                          <Label htmlFor="smtpHost">{t('Host')}</Label>
                          <Input
                            {...field}
                            required
                            id="smtpHost"
                            placeholder="smtp.example.com"
                            className="rounded-sm"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      name="smtpPort"
                      render={({ field }) => (
                        <FormItem className="grid space-y-2">
                          <Label htmlFor="smtpPort">{t('Port')}</Label>
                          <Input
                            {...field}
                            type="number"
                            required
                            id="smtpPort"
                            placeholder={'587'}
                            className="rounded-sm"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      name="smtpUser"
                      render={({ field }) => (
                        <FormItem className="grid space-y-2">
                          <Label htmlFor="smtpUser">{t('Username')}</Label>
                          <Input
                            {...field}
                            required
                            id="smtpUser"
                            placeholder={t('username')}
                            className="rounded-sm"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      name="smtpPassword"
                      render={({ field }) => (
                        <FormItem className="grid space-y-2">
                          <Label htmlFor="smtpPassword">{t('Password')}</Label>
                          <Input
                            {...field}
                            type="password"
                            required
                            id="smtpPassword"
                            placeholder={t('password')}
                            className="rounded-sm"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      name="smtpSenderEmail"
                      render={({ field }) => (
                        <FormItem className="grid space-y-2">
                          <Label htmlFor="smtpSenderEmail">{t('Sender Email')}</Label>
                          <Input
                            {...field}
                            required
                            id="smtpSenderEmail"
                            placeholder="sender@example.com"
                            className="rounded-sm"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      name="smtpUseSSL"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-4">
                          <Label htmlFor="smtpUseSSL">{t('Use SSL')}</Label>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id="smtpUseSSL"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form?.formState?.errors?.root?.serverError && (
                      <FormMessage>
                        {form.formState.errors.root.serverError.message}
                      </FormMessage>
                    )}
                  </form>
                </Form>
                <div className="flex gap-2 justify-end mt-4">
                  <Button
                    loading={isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      updatePlatform();
                    }}
                    disabled={!form.formState.isValid}
                  >
                    {t('Save')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Card>
  );
};
