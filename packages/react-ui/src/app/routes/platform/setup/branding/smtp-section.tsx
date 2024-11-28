import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { CheckCircle2, Mailbox } from 'lucide-react';
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
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { INTERNAL_ERROR_MESSAGE, useToast } from '@/components/ui/use-toast';
import { platformHooks } from '@/hooks/platform-hooks';
import { api } from '@/lib/api';
import { platformApi } from '@/lib/platforms-api';
import { ApErrorParams, ErrorCode, isNil } from '@activepieces/shared';

const FromSchema = Type.Object({
  host: Type.String({
    minLength: 1,
    errorMessage: t('Invalid host'),
  }),
  port: Type.String(),
  user: Type.String({
    minLength: 1,
    errorMessage: t('Invalid username'),
  }),
  password: Type.String({
    minLength: 1,
    errorMessage: t('Invalid password'),
  }),
  senderEmail: Type.String({
    minLength: 1,
    errorMessage: t('Invalid sender email'),
  }),
  senderName: Type.String({
    minLength: 1,
    errorMessage: t('Invalid sender name'),
  }),
});

type FromSchema = Static<typeof FromSchema>;

export const SmtpSection = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<FromSchema>({
    defaultValues: {
      host: platform?.smtp?.host,
      port: (platform?.smtp?.port ?? 587).toString(),
      user: platform?.smtp?.user,
      password: platform?.smtp?.password,
      senderEmail: platform?.smtp?.senderEmail,
      senderName: platform?.smtp?.senderName,
    },
    resolver: typeboxResolver(FromSchema),
  });

  const { toast } = useToast();

  const smtpConfigured = !isNil(platform?.smtp);

  const { mutate: updatePlatform, isPending } = useMutation({
    mutationFn: async (request: FromSchema) =>
      platformApi.update(
        {
          smtp: {
            ...request,
            port: Number(request.port),
          },
        },
        platform.id,
      ),
    onSuccess: () => {
      setIsOpen(false);
      toast({
        title: t('Success'),
        description: t('Your changes have been saved.'),
        duration: 3000,
      });
    },
    onError: (e) => {
      let message = INTERNAL_ERROR_MESSAGE;
      if (api.isError(e)) {
        const responseData = e.response?.data as ApErrorParams;
        if (responseData.code === ErrorCode.INVALID_SMTP_CREDENTIALS) {
          message = `Invalid SMTP credentials, please check the credentials, \n ${responseData.params.message}`;
        }
      }
      form.setError('root.serverError', {
        message: message,
      });
    },
  });

  return (
    <>
      <Separator className="my-2" />
      <Card className="w-full px-4 py-4">
        <div className="flex w-full gap-2 justify-center items-center">
          <div className="flex items-center gap-2 mr-2">
            {smtpConfigured && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <CheckCircle2 className="w-5 h-5 text-success" />
                </TooltipTrigger>
                <TooltipContent>{t('SMTP is configured')}</TooltipContent>
              </Tooltip>
            )}

            <Mailbox className="w-8 h-8" />
          </div>
          <div className="flex flex-grow  flex-col">
            <div className="text-md">Mail Server</div>
            <div className="text-sm text-muted-foreground">
              {t('Set up your SMTP settings to send emails from your domain.')}
            </div>
          </div>
          <div className="flex flex-col justify-center items-center">
            <Dialog
              open={isOpen}
              onOpenChange={(open) => {
                if (!open) {
                  form.reset();
                }
                setIsOpen(open);
              }}
            >
              <DialogTrigger asChild>
                <Button variant={'basic'}>
                  {smtpConfigured ? t('Update') : t('Configure')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('Mail Server')}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-1 mt-4 w-[">
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit((data) =>
                        updatePlatform(data),
                      )}
                      className="grid space-y-4"
                    >
                      <FormField
                        name="host"
                        render={({ field }) => (
                          <FormItem className="grid space-y-2">
                            <FormLabel htmlFor="host">{t('Host')}</FormLabel>
                            <Input
                              {...field}
                              required
                              id="host"
                              placeholder="smtp.example.com"
                              className="rounded-sm"
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        name="port"
                        render={({ field }) => (
                          <FormItem className="grid space-y-2">
                            <FormLabel htmlFor="port">{t('Port')}</FormLabel>
                            <Select
                              value={field.value?.toString() ?? ''}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Port" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="465">465</SelectItem>
                                <SelectItem value="587">587</SelectItem>
                                <SelectItem value="2525">2525</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        name="user"
                        render={({ field }) => (
                          <FormItem className="grid space-y-2">
                            <FormLabel htmlFor="user">
                              {t('Username')}
                            </FormLabel>
                            <Input
                              {...field}
                              id="user"
                              className="rounded-sm"
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        name="password"
                        render={({ field }) => (
                          <FormItem className="grid space-y-2">
                            <FormLabel htmlFor="password">
                              {t('Password')}
                            </FormLabel>
                            <Input
                              {...field}
                              type="password"
                              id="password"
                              className="rounded-sm"
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        name="senderEmail"
                        render={({ field }) => (
                          <FormItem className="grid space-y-2">
                            <FormLabel htmlFor="senderEmail">
                              {t('Sender Email')}
                            </FormLabel>
                            <Input
                              {...field}
                              id="senderEmail"
                              className="rounded-sm"
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        name="senderName"
                        render={({ field }) => (
                          <FormItem className="grid space-y-2">
                            <FormLabel htmlFor="senderName">
                              {t('Sender Name')}
                            </FormLabel>
                            <Input
                              {...field}
                              id="senderName"
                              className="rounded-sm"
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form?.formState?.errors?.root?.serverError && (
                        <div className="w-[400px]">
                          <FormMessage>
                            {form.formState.errors.root.serverError.message}
                          </FormMessage>
                        </div>
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
