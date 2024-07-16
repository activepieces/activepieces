import {
  AuthenticationResponse,
  SignInRequest,
  SignUpRequest,
} from '@activepieces/shared';
import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { HttpStatusCode } from 'axios';
import React from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';

import { authenticationApi } from '../../../lib/authentication-api';
import { authenticationSession } from '../../../lib/authentication-session';

import { Button } from '@/components/ui/button';
import { FormField, FormItem, Form, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HttpError, api } from '@/lib/api';

const AuthFormSchema = Type.Object({
  firstName: Type.Optional(
    Type.String({
      errorMessage: 'First name is required',
    }),
  ),
  lastName: Type.Optional(
    Type.String({
      errorMessage: 'Last name is required',
    }),
  ),
  email: Type.String({
    errorMessage: 'Email is required',
  }),
  password: Type.String({
    errorMessage: 'Password is required',
  }),
  trackEvents: Type.Optional(Type.Boolean()),
  newsLetter: Type.Optional(Type.Boolean()),
});

type AuthFormSchema = Static<typeof AuthFormSchema>;

const UsernameAndPasswordForm: React.FC<{
  isSignUp: boolean;
}> = React.memo(({ isSignUp }) => {
  const defaultValues = isSignUp
    ? {
        trackEvents: true,
        newsLetter: false,
      }
    : {};

  const form = useForm<AuthFormSchema>({
    defaultValues,
    resolver: typeboxResolver(AuthFormSchema),
  });

  const navigate = useNavigate();

  const { mutate, isPending } = useMutation<
    AuthenticationResponse,
    HttpError,
    SignInRequest
  >({
    mutationFn: isSignUp ? authenticationApi.signUp : authenticationApi.signIn,
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

  const onSubmit: SubmitHandler<SignInRequest | SignUpRequest> = (data) => {
    form.setError('root.serverError', {
      message: undefined,
    });
    mutate(data);
  };

  return (
    <>
      <Form {...form}>
        <form className="grid space-y-4">
          {isSignUp && (
            <div className={'flex flex-row gap-2'}>
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem className="w-full grid space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      {...field}
                      required
                      id="firstName"
                      type="text"
                      placeholder="John"
                      className="rounded-sm"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem className="w-full grid space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      {...field}
                      required
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      className="rounded-sm"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
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
            loading={isPending}
            onClick={(e) => form.handleSubmit(onSubmit)(e)}
          >
            {isSignUp ? 'Sign up' : 'Sign in'}
          </Button>
        </form>
      </Form>

      <div className="mt-4 text-center text-sm">
        {isSignUp ? 'Have an account?' : "Don't have an account?"}
        <Link
          to={isSignUp ? '/sign-in' : '/sign-up'}
          className="pl-1 text-muted-foreground hover:text-primary text-sm transition-all duration-200"
        >
          {isSignUp ? 'Sign in' : 'Sign up'}
        </Link>
      </div>
    </>
  );
});

UsernameAndPasswordForm.displayName = 'UsernameAndPasswordForm';

export { UsernameAndPasswordForm };
