import { CreateOtpRequestBody, OtpType } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';

import { authenticationApi } from '@/api/authentication-api';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckEmailNote } from '@/features/authentication/components/check-email-note';
import { HttpError } from '@/lib/api';

import { AuthCard } from './auth-layout';

const FormSchema = z.object({
  email: z.string().min(1, t('Please enter your email')),
  type: CreateOtpRequestBody.shape.type,
});

type FormSchema = z.infer<typeof FormSchema>;

const ResetPasswordForm = () => {
  const [isSent, setIsSent] = useState<boolean>(false);
  const form = useForm<FormSchema>({
    resolver: zodResolver(FormSchema),
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
  });

  const onSubmit: SubmitHandler<CreateOtpRequestBody> = (data) => {
    mutate(data);
  };

  return (
    <AuthCard
      title={isSent ? t('Check your inbox') : t('Reset password')}
      description={
        isSent
          ? undefined
          : t(
              "Enter your account's email and we'll send you a link to reset your password.",
            )
      }
    >
      {isSent ? (
        <CheckEmailNote
          email={form.getValues().email.trim().toLocaleLowerCase()}
          type={OtpType.PASSWORD_RESET}
        />
      ) : (
        <Form {...form}>
          <form className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="email">{t('Email')}</Label>
                  <Input
                    {...field}
                    id="email"
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
              {t('Send reset link')}
            </Button>
          </form>
        </Form>
      )}
      <Link
        to="/sign-in"
        className="w-fit text-sm text-gray-11 transition-colors hover:text-gray-12"
      >
        {t('Back to sign in')}
      </Link>
    </AuthCard>
  );
};

ResetPasswordForm.displayName = 'ResetPassword';

export { ResetPasswordForm };
