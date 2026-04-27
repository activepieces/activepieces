import {
  OtpType,
  ApEdition,
  ApFlagId,
  AuthenticationResponse,
  ErrorCode,
  isNil,
  SignInRequest,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Link, Navigate } from 'react-router-dom';
import { z } from 'zod';

import { authenticationApi } from '@/api/authentication-api';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { flagsHooks } from '@/hooks/flags-hooks';
import { HttpError, api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/format-utils';
import { useRedirectAfterLogin } from '@/lib/navigation-utils';

import { CheckEmailNote } from './check-email-note';

const SignInSchema = z.object({
  email: z.string().regex(formatUtils.emailRegex, t('Email is invalid')),
  password: z.string().min(1, t('Password is required')),
});

type SignInSchema = z.infer<typeof SignInSchema>;

const SignInForm: React.FC = () => {
  const [showCheckYourEmailNote, setShowCheckYourEmailNote] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<SignInSchema>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange',
  });

  const { data: edition } = flagsHooks.useFlag(ApFlagId.EDITION);

  const { data: userCreated } = flagsHooks.useFlag(ApFlagId.USER_CREATED);
  const redirectAfterLogin = useRedirectAfterLogin();

  const { mutate, isPending } = useMutation<
    AuthenticationResponse,
    HttpError,
    SignInRequest
  >({
    mutationFn: authenticationApi.signIn,
    onSuccess: (data) => {
      authenticationSession.saveResponse(data, false);
      redirectAfterLogin();
    },
    onError: (error) => {
      if (api.isError(error)) {
        const errorCode: ErrorCode | undefined = (
          error.response?.data as { code: ErrorCode }
        )?.code;
        if (isNil(errorCode)) {
          form.setError('root.serverError', {
            message: t('Something went wrong, please try again later'),
          });
          return;
        }
        switch (errorCode) {
          case ErrorCode.INVALID_CREDENTIALS: {
            form.setError('root.serverError', {
              message: t('Invalid email or password'),
            });
            break;
          }
          case ErrorCode.USER_IS_INACTIVE: {
            form.setError('root.serverError', {
              message: t('User has been deactivated'),
            });
            break;
          }
          case ErrorCode.EMAIL_IS_NOT_VERIFIED: {
            setShowCheckYourEmailNote(true);
            break;
          }
          case ErrorCode.DOMAIN_NOT_ALLOWED: {
            form.setError('root.serverError', {
              message: t(`Email domain is disallowed`),
            });
            break;
          }
          case ErrorCode.EMAIL_AUTH_DISABLED: {
            form.setError('root.serverError', {
              message: t(`Email authentication has been disabled`),
            });
            break;
          }
          default: {
            form.setError('root.serverError', {
              message: t('Something went wrong, please try again later'),
            });
          }
        }
      }
    },
  });

  const onSubmit: SubmitHandler<SignInRequest> = (data) => {
    form.setError('root.serverError', {
      message: undefined,
    });
    mutate(data);
  };

  if (!userCreated) {
    return <Navigate to="/sign-up" />;
  }

  return (
    <>
      <Form {...form}>
        <form className="grid space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="grid space-y-2">
                <Label htmlFor="email">{t('Email')}</Label>
                <Input
                  {...field}
                  required
                  id="email"
                  type="text"
                  placeholder={'email@example.com'}
                  className="rounded-sm"
                  tabIndex={1}
                  data-testid="sign-in-email"
                  onChange={(e) => {
                    field.onChange(e);
                    setShowCheckYourEmailNote(false);
                  }}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="grid space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t('Password')}</Label>
                  {edition !== ApEdition.COMMUNITY && (
                    <Link
                      to="/forget-password"
                      className="text-muted-foreground text-xs hover:text-primary transition-all duration-200"
                    >
                      {t('Forgot your password?')}
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Input
                    {...field}
                    required
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={'********'}
                    className="rounded-sm pr-10"
                    tabIndex={2}
                    data-testid="sign-in-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                <FormMessage />
              </FormItem>
            )}
          />
          {form?.formState?.errors?.root?.serverError && (
            <FormMessage>
              {form.formState.errors.root.serverError.message}
            </FormMessage>
          )}
          <Button
            loading={isPending}
            onClick={(e) => form.handleSubmit(onSubmit)(e)}
            tabIndex={3}
            data-testid="sign-in-button"
          >
            {t('Sign in')}
          </Button>
        </form>
      </Form>

      {showCheckYourEmailNote && (
        <div className="mt-4">
          <CheckEmailNote
            email={form.getValues().email}
            type={OtpType.EMAIL_VERIFICATION}
          />
        </div>
      )}
    </>
  );
};

SignInForm.displayName = 'SignIn';

export { SignInForm };
