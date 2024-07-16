import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { HttpStatusCode } from 'axios';
import React from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { FormField, FormItem, Form, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HttpError, api } from '@/lib/api';
import { AuthenticationResponse, SignInRequest } from '@activepieces/shared';

import { authenticationApi } from '../../../lib/authentication-api';
import { authenticationSession } from '../../../lib/authentication-session';

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

  const mutation = useMutation<
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
    mutation.mutate(data);
  };

  return (
    <>
      <Form {...form}>
        <form className="grid gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  {...field}
                  id="email"
                  type="text"
                  placeholder="gilfoyle@piedpiper.com"
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/forget-password"
                    className="ml-auto inline-block text-sm underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  {...field}
                  id="password"
                  type="password"
                  placeholder="********"
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
            className="w-full"
            onClick={(e) => form.handleSubmit(onSubmit)(e)}
          >
            Sign in
          </Button>
        </form>
      </Form>

      <div className="mt-4 text-center text-sm">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="underline">
          Sign up
        </Link>
      </div>
    </>
  );
});

UsernameAndPasswordForm.displayName = 'UsernameAndPasswordForm';

export { UsernameAndPasswordForm };
