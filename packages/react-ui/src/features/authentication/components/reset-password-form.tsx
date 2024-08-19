import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Type, Static } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { MailCheck } from 'lucide-react';
import { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { HttpError, api } from '@/lib/api';
import { authenticationApi } from '@/lib/authentication-api';
import { CreateOtpRequestBody, OtpType } from '@activepieces/ee-shared';

const FormSchema = Type.Object({
  email: Type.String({
    errorMessage: t('Please enter your email'),
  }),
  type: Type.Enum(OtpType),
});

type FormSchema = Static<typeof FormSchema>;

const ResetPasswordForm = () => {
  const [isSent, setIsSent] = useState<boolean>(false);
  const form = useForm<FormSchema>({
    resolver: typeboxResolver(FormSchema),
    defaultValues: {
      type: OtpType.PASSWORD_RESET,
    },
  });

  const { mutate, isPending } = useMutation<
    void,
    HttpError,
    CreateOtpRequestBody
  >({
    mutationFn: authenticationApi.sendOtpEmail,
    onSuccess: () => setIsSent(true),
    onError: (error) => {
      if (api.isError(error)) {
        toast(INTERNAL_ERROR_TOAST);
      }
    },
  });

  const handleResendClick = (
    e: React.MouseEvent<HTMLSpanElement, MouseEvent>,
  ) => {
    e.preventDefault();
    form.handleSubmit(onSubmit)(e);
  };

  const onSubmit: SubmitHandler<CreateOtpRequestBody> = (data) => {
    mutate(data);
  };

  return (
    <Card className="w-[28rem] rounded-sm drop-shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">
          {isSent ? t('Check Your Inbox') : t('Reset Password')}
        </CardTitle>
        <CardDescription>
          {isSent ? (
            <div className="gap-2 w-full flex flex-col">
              <div className="gap-4 w-full flex flex-row items-center justify-center">
                <MailCheck className="w-16 h-16" />
                <span className="text-left w-fit">
                  {t('We sent you a link to')}{' '}
                  <strong>{form.getValues().email}</strong>.{' '}
                  {t('Check your email to reset your password.')}
                </span>
              </div>
              <div className="flex flex-row gap-1">
                {t("Didn't receive an email?")}
                <span
                  className="cursor-pointer text-primary underline"
                  onClick={handleResendClick}
                >
                  {t('Resend')}
                </span>
              </div>
            </div>
          ) : (
            <span>
              {t(
                'If the email you entered exists, you will receive an email with a link to reset your password.',
              )}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isSent && (
          <Form {...form}>
            <form className="grid gap-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="w-full grid space-y-2">
                    <Label htmlFor="email">{t('Email')}</Label>
                    <Input
                      {...field}
                      type="text"
                      placeholder={'email@example.com'}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                className="w-full"
                loading={isPending}
                onClick={(e) => form.handleSubmit(onSubmit)(e)}
              >
                {t('Send Password Reset Link')}
              </Button>
            </form>
          </Form>
        )}
        <div className="mt-2 text-center text-sm">
          <Link to="/sign-in" className="text-muted-foreground">
            {t('Back to sign in')}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

ResetPasswordForm.displayName = 'ResetPassword';

export { ResetPasswordForm };
