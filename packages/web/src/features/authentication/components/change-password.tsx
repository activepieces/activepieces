import { ResetPasswordRequestBody } from '@activepieces/shared';
import { t } from 'i18next';
import { useRef, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import { PasswordRequirementsList } from '@/features/authentication/components/password-validator';
import { passwordValidation } from '@/features/authentication/utils/password-validation-utils';

import { authMutations } from '../hooks/auth-hooks';

import { AuthCard } from './auth-layout';

const ChangePasswordForm = () => {
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(window.location.search);
  const [serverError, setServerError] = useState('');
  const [isPasswordFocused, setPasswordFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
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
    <AuthCard
      title={t('Reset Password')}
      description={t('Enter your new password')}
    >
      <Form {...form}>
        <form className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="newPassword"
            rules={{
              required: t('Password is required'),
              validate: passwordValidation,
            }}
            render={({ field }) => (
              <FormItem
                onClick={() => inputRef?.current?.focus()}
                onFocus={() => setPasswordFocused(true)}
              >
                <Label htmlFor="newPassword">{t('Password')}</Label>
                <Popover open={isPasswordFocused}>
                  <PopoverAnchor asChild>
                    <Input
                      {...field}
                      required
                      id="newPassword"
                      type="password"
                      placeholder={'********'}
                      ref={inputRef}
                      onBlur={() => setPasswordFocused(false)}
                      onChange={(e) => field.onChange(e)}
                    />
                  </PopoverAnchor>
                  <PopoverContent
                    side="right"
                    align="center"
                    sideOffset={8}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    className="w-auto"
                  >
                    <PasswordRequirementsList
                      password={field.value ?? ''}
                      isSubmitted={form.formState.submitCount > 0}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          {serverError && <FormMessage>{serverError}</FormMessage>}
          <Button
            className="w-full"
            loading={isPending}
            onClick={(e) => form.handleSubmit(onSubmit)(e)}
          >
            {t('Confirm')}
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
};

export { ChangePasswordForm };
