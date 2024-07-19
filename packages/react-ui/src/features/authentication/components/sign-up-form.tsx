import {
  ApFlagId,
  AuthenticationResponse,
  SignUpRequest,
} from '@activepieces/shared';
import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { HttpStatusCode } from 'axios';
import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { flagsHooks } from '@/hooks/flags-hooks';
import { HttpError, api } from '@/lib/api';
import { authenticationApi } from '@/lib/authentication-api';
import { authenticationSession } from '@/lib/authentication-session';

const SignUpSchema = Type.Object({
  firstName: Type.String({
    errorMessage: 'First name is required',
  }),
  lastName: Type.String({
    errorMessage: 'Last name is required',
  }),
  email: Type.String({
    format: 'email',
    errorMessage: 'Email is required',
  }),
  password: Type.String({
    errorMessage: 'Password is required',
  }),
  trackEvents: Type.Boolean(),
  newsLetter: Type.Boolean(),
});

type SignUpSchema = Static<typeof SignUpSchema>;

const MIN_LENGTH = 8;
const MAX_LENGTH = 64;
const SPECIAL_CHARACTER_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;
const LOWERCASE_REGEX = /[a-z]/;
const UPPERCASE_REGEX = /[A-Z]/;
const NUMBER_REGEX = /[0-9]/;

const PasswordValidator = ({ password }: { password: string }) => {
  const validationRules = [
    {
      label: '8-64 Characters',
      condition: password.length >= MIN_LENGTH && password.length <= MAX_LENGTH,
    },
    {
      label: 'Special Character',
      condition: SPECIAL_CHARACTER_REGEX.test(password),
    },
    { label: 'Lowercase', condition: LOWERCASE_REGEX.test(password) },
    { label: 'Uppercase', condition: UPPERCASE_REGEX.test(password) },
    { label: 'Number', condition: NUMBER_REGEX.test(password) },
  ];

  return (
    <div className="absolute border-2 bg-white p-2 rounded-md -right-48 bottom-24 flex flex-col">
      {validationRules.map((rule, index) => {
        return (
          <div key={index} className="flex flex-row gap-2">
            {rule.condition ? (
              <Check className="text-green-500" />
            ) : (
              <X className="text-gray-500" />
            )}
            <span>{rule.label}</span>
          </div>
        );
      })}
    </div>
  );
};

const SignUpForm: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: isCloudPlatform } = flagsHooks.useFlag<boolean>(
    ApFlagId.IS_CLOUD_PLATFORM,
    queryClient,
  );
  const { data: termsOfServiceUrl } = flagsHooks.useFlag<string>(
    ApFlagId.TERMS_OF_SERVICE_URL,
    queryClient,
  );
  const { data: privacyPolicyUrl } = flagsHooks.useFlag<string>(
    ApFlagId.PRIVACY_POLICY_URL,
    queryClient,
  );

  const defaultValues = {
    trackEvents: true,
    newsLetter: false,
  };

  const form = useForm<SignUpSchema>({
    defaultValues,
    resolver: typeboxResolver(SignUpSchema),
  });

  const navigate = useNavigate();

  const { mutate, isPending } = useMutation<
    AuthenticationResponse,
    HttpError,
    SignUpRequest
  >({
    mutationFn: authenticationApi.signUp,
    onSuccess: (data) => {
      authenticationSession.saveResponse(data);
      navigate('/flows');
    },
    onError: (error) => {
      if (api.isError(error)) {
        switch (error.response?.status) {
          case HttpStatusCode.Conflict: {
            form.setError('root.serverError', {
              message: 'Email is already used',
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

  const onSubmit: SubmitHandler<SignUpRequest> = (data) => {
    form.setError('root.serverError', {
      message: undefined,
    });
    mutate(data);
  };

  const [isPasswordFocused, setPasswordFocused] = useState(false);

  return (
    <>
      <Form {...form}>
        <form className="grid space-y-4">
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
                <Label htmlFor="password">Password</Label>
                <Input
                  {...field}
                  {...form.register('password', {
                    minLength: {
                      value: MIN_LENGTH,
                      message: 'Password must be at least 8 characters long',
                    },
                    maxLength: {
                      value: MAX_LENGTH,
                      message: "Password can't be more than 64 characters long",
                    },
                    pattern: {
                      value: SPECIAL_CHARACTER_REGEX,
                      message:
                        'Password must contain at least one special character',
                    },
                    validate: {
                      hasLowercaseCharacter: (value) =>
                        LOWERCASE_REGEX.test(value) ||
                        'Password must contain at least one lowercase letter',
                      hasUppercaseCharacter: (value) =>
                        UPPERCASE_REGEX.test(value) ||
                        'Password must contain at least one uppercase letter',
                      hasNumber: (value) =>
                        NUMBER_REGEX.test(value) ||
                        'Password must contain at least one number',
                    },
                  })}
                  required
                  id="password"
                  type="password"
                  placeholder="********"
                  className="rounded-sm"
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                {isPasswordFocused && (
                  <PasswordValidator password={form.getValues().password} />
                )}
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
            Sign up
          </Button>
        </form>
      </Form>
      {isCloudPlatform && (
        <div className="mt-4 text-center text-sm">
          By creating an account, you agree to our
          <Link
            to={termsOfServiceUrl || ''}
            target="_blank"
            className="px-1 text-muted-foreground hover:text-primary text-sm transition-all duration-200"
          >
            terms of service
          </Link>
          and
          <Link
            to={privacyPolicyUrl || ''}
            target="_blank"
            className="pl-1 text-muted-foreground hover:text-primary text-sm transition-all duration-200"
          >
            privacy policy
          </Link>
          .
        </div>
      )}
      <div className="mt-4 text-center text-sm">
        Have an account?
        <Link
          to="/sign-in"
          className="pl-1 text-muted-foreground hover:text-primary text-sm transition-all duration-200"
        >
          Sign in
        </Link>
      </div>
    </>
  );
};

SignUpForm.displayName = 'SignUp';

export { SignUpForm };
