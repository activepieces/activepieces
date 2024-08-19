import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { HttpStatusCode } from 'axios';
import { t } from 'i18next';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HttpError, api } from '@/lib/api';
import { authenticationApi } from '@/lib/authentication-api';
import { authenticationSession } from '@/lib/authentication-session';
import { AuthenticationResponse, SignInRequest } from '@activepieces/shared';

const SignInSchema = Type.Object({
  email: Type.String({
    errorMessage: t('Email is required'),
  }),
  password: Type.String({
    errorMessage: t('Password is required'),
  }),
});

type SignInSchema = Static<typeof SignInSchema>;

const SignInForm: React.FC = () => {
  const form = useForm<SignInSchema>({
    resolver: typeboxResolver(SignInSchema),
  });

  const navigate = useNavigate();

  const { mutate, isPending } = useMutation<
    AuthenticationResponse,
    HttpError,
    SignInRequest
  >({
    mutationFn: authenticationApi.signIn,
    onSuccess: (data) => {
      authenticationSession.saveResponse(data);
      navigate('/flows');
    },
    onError: (error) => {
      if (api.isError(error)) {
        switch (error.response?.status) {
          case HttpStatusCode.Unauthorized: {
            form.setError('root.serverError', {
              message: t('Invalid email or password'),
            });
            break;
          }
          default: {
            form.setError('root.serverError', {
              message: t('Something went wrong, please try again later'),
            });
            break;
          }
        }
        return;
      }
    },
  });

  const onSubmit: SubmitHandler<SignInRequest> = (data) => {
    form.setError('root.serverError', {
      message: undefined,
    });
    mutate(data);
  };

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
                  <Link
                    to="/forget-password"
                    className="text-muted-foreground text-sm hover:text-primary transition-all duration-200"
                  >
                    {t('Forgot your password?')}
                  </Link>
                </div>
                <Input
                  {...field}
                  required
                  id="password"
                  type="password"
                  placeholder={'********'}
                  className="rounded-sm"
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
          <Button
            loading={isPending}
            onClick={(e) => form.handleSubmit(onSubmit)(e)}
          >
            {t('Sign in')}
          </Button>
        </form>
      </Form>

      <div className="mt-4 text-center text-sm">
        {t("Don't have an account?")}
        <Link
          to="/sign-up"
          className="pl-1 text-muted-foreground hover:text-primary text-sm transition-all duration-200"
        >
          {t('Sign up')}
        </Link>
      </div>
    </>
  );
};

SignInForm.displayName = 'SignIn';

export { SignInForm };
