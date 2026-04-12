import { ResetPasswordRequestBody } from '@activepieces/shared';
import { t } from 'i18next';
import { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
import { PasswordStrengthBolt } from '@/features/authentication/components/password-validator';
import { passwordValidation } from '@/features/authentication/utils/password-validation-utils';

import { authMutations } from '../hooks/auth-hooks';

const ChangePasswordForm = () => {
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(window.location.search);
  const [serverError, setServerError] = useState('');
  const form = useForm<{
    otp: string;
    identityId: string;
    newPassword: string;
  }>({
    defaultValues: {
      otp: queryParams.get('otpcode') || '',
      identityId: queryParams.get('identityId') || '',
      newPassword: '',
    },
  });

  const { mutate, isPending } = authMutations.useResetPassword({
    onSuccess: () => {
      toast.success(t('Your password was changed successfully'), {
        duration: 3000,
      });
      navigate('/sign-in');
    },
    onError: (error) => {
      setServerError(
        t('Your password reset request has expired, please request a new one'),
      );
      console.error(error);
    },
  });

  const onSubmit: SubmitHandler<ResetPasswordRequestBody> = (data) => {
    mutate(data);
  };

  return (
    <Card className="w-md rounded-sm drop-shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">{t('Reset Password')}</CardTitle>
        <CardDescription>{t('Enter your new password')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="grid gap-2">
            <FormField
              control={form.control}
              name="newPassword"
              rules={{
                required: t('Password is required'),
                validate: passwordValidation,
              }}
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="newPassword">{t('Password')}</Label>
                  <div className="relative flex items-center">
                    <Input
                      {...field}
                      required
                      id="newPassword"
                      type="password"
                      placeholder={'********'}
                      className="rounded-sm pr-10"
                    />
                    <div className="absolute right-3">
                      <PasswordStrengthBolt password={field.value ?? ''} />
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            {serverError && <FormMessage>{serverError}</FormMessage>}
            <Button
              className="w-full mt-2"
              loading={isPending}
              onClick={(e) => form.handleSubmit(onSubmit)(e)}
            >
              {t('Confirm')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export { ChangePasswordForm };
