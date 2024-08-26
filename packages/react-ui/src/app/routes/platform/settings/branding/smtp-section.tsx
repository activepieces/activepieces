import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Mailbox } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/seperator';
import { Switch } from '@/components/ui/switch';
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { platformHooks } from '@/hooks/platform-hooks';
import { platformApi } from '@/lib/platforms-api';
import { isNil } from '@activepieces/shared';

const FromSchema = Type.Object({
  smtpHost: Type.String({
    minLength: 1,
    errorMessage: t('Invalid host'),
  }),
  smtpPort: Type.Number(),
  smtpUser: Type.String({
    minLength: 1,
    errorMessage: t('Invalid username'),
  }),
  smtpPassword: Type.String({
    minLength: 1,
    errorMessage: t('Invalid password'),
  }),
  smtpSenderEmail: Type.String({
    minLength: 1,
    errorMessage: t('Invalid sender email'),
  }),
  smtpUseSSL: Type.Boolean(),
});

type FromSchema = Static<typeof FromSchema>;

export const SmtpSection = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<FromSchema>({
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
    mutationFn: async (request: FromSchema) =>
      platformApi.update(request, platform.id),
    onSuccess: () => {
      setIsOpen(false);
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
    <>
      <Separator className="my-2" />
      <Card className="w-full px-4 py-4">
        <div className="flex w-full gap-2 justify-center items-center">
          <div className="flex flex-col gap-2 text-center mr-2">
            <Mailbox className="w-8 h-8" />
          </div>
          <div className="flex flex-grow  flex-col">
            <div className="text-md">Mail Server</div>
            <div className="text-sm text-muted-foreground">
              {t('Configure SMTP settings for outgoing email')}
            </div>
          </div>
          <div className="flex flex-col justify-center items-center">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button variant={'basic'}>
                  {!isNil(platform?.smtpHost) ? t('Update') : t('Add')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('Mail Server')}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-1 mt-4">
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit((data) =>
                        updatePlatform(data),
                      )}
                      className="grid space-y-4"
                    >
                      <FormField
                        name="smtpHost"
                        render={({ field }) => (
                          <FormItem className="grid space-y-2">
                            <FormLabel htmlFor="smtpHost">
                              {t('Host')}
                            </FormLabel>
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
                            <FormLabel htmlFor="smtpPort">
                              {t('Port')}
                            </FormLabel>
                            <Input
                              value={field.value}
                              onChange={(e: { target: { value: any } }) =>
                                field.onChange(Number(e.target.value))
                              }
                              type="number"
                              id="smtpPort"
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
                            <FormLabel htmlFor="smtpUser">
                              {t('Username')}
                            </FormLabel>
                            <Input
                              {...field}
                              id="smtpUser"
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
                            <FormLabel htmlFor="smtpPassword">
                              {t('Password')}
                            </FormLabel>
                            <Input
                              {...field}
                              type="password"
                              id="smtpPassword"
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
                            <FormLabel htmlFor="smtpSenderEmail">
                              {t('Sender Email')}
                            </FormLabel>
                            <Input
                              {...field}
                              id="smtpSenderEmail"
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
                            <FormLabel htmlFor="smtpUseSSL">
                              {t('Use SSL')}
                            </FormLabel>
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
                      <div className="flex gap-2 justify-end mt-4">
                        <Button loading={isPending} type="submit">
                          {t('Save')}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Card>
    </>
  );
};
