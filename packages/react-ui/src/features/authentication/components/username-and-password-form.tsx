import { AuthenticationResponse, SignInRequest } from '@activepieces/shared';
import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { HttpStatusCode } from 'axios';
import React from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';

import { authenticationApi } from '../lib/authentication-api';
import { authenticationSession } from '../lib/authentication-session';

import { Button } from '@/components/ui/button';
import { FormField, FormItem, Form, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HttpError, api } from '@/lib/api';

const SignInFormsSchema = Type.Object({
  email: Type.String({
    errorMessage: 'Email is required',
  }),
  password: Type.String({
    errorMessage: 'Password is required',
  }),
});

type SignInFormsSchema = Static<typeof SignInFormsSchema>;

const UsernameAndPasswordForm: React.FC = React.memo(() => {
  const form = useForm<SignInFormsSchema>({
    resolver: typeboxResolver(SignInFormsSchema),
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
              message: 'Invalid email or password',
            });
            break;
          }
          default: {
            form.setError('root.serverError', {
              message: 'Something went wrong, please try again later',
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
        <form className="mt-4 grid space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="grid space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  {...field}
                  required
                  id="email"
                  type="text"
                  placeholder="email@activepieces.com"
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
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/forget-password"
                    className="text-muted-foreground hover:text-primary text-sm transition-all duration-200"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  {...field}
                  required
                  id="password"
                  type="password"
                  placeholder="********"
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
            variant="outline"
            className="bg-primary text-primary-foreground w-full rounded-sm"
            loading={isPending}
            onClick={(e) => form.handleSubmit(onSubmit)(e)}
          >
            Sign in
          </Button>
        </form>
      </Form>

      <div className="mt-4 text-center text-sm">
        Don&apos;t have an account?{' '}
        <Link
          to="/signup"
          className="text-muted-foreground hover:text-primary text-sm transition-all duration-200"
        >
          Sign up
        </Link>
      </div>
    </>
  );
});

UsernameAndPasswordForm.displayName = 'UsernameAndPasswordForm';

export { UsernameAndPasswordForm };
