import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { HttpStatusCode } from 'axios';
import { Check, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { flagsHooks } from '@/hooks/flags-hooks';
import { HttpError, api } from '@/lib/api';
import { authenticationApi } from '@/lib/authentication-api';
import { authenticationSession } from '@/lib/authentication-session';
import {
  ApFlagId,
  AuthenticationResponse,
  SignUpRequest,
} from '@activepieces/shared';

import { generatePasswordValidation } from '../lib/password-validation-utils';

const SignUpSchema = Type.Object({
  firstName: Type.String({
    errorMessage: 'First name is required',
  }),
  lastName: Type.String({
    errorMessage: 'Last name is required',
  }),
  email: Type.String({
    errorMessage: 'Email is invalid',
    pattern:
      '^[a-zA-Z0-9.!#$%&’+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:.[a-zA-Z0-9-]+)$',
  }),
  password: Type.String({
    errorMessage: 'Password is required',
  }),
  trackEvents: Type.Boolean(),
  newsLetter: Type.Boolean(),
});

type SignUpSchema = Static<typeof SignUpSchema>;

const PasswordValidator = ({ password }: { password: string }) => {
  const { rules } = generatePasswordValidation(password);

  return (
    <>
      {rules.map((rule, index) => {
        return (
          <div key={index} className="flex flex-row gap-2">
            {rule.condition ? (
              <Check className="text-success" />
            ) : (
              <X className="text-destructive" />
            )}
            <span>{rule.label}</span>
          </div>
        );
      })}
    </>
  );
};

const SignUpForm: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
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
    password: '',
    email: searchParams.get('email') || '',
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
  const inputRef = useRef<HTMLInputElement>(null);
  const { formValidationObject } = generatePasswordValidation('');

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
                  type="email"
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
              <FormItem
                className="grid space-y-2"
                onClick={() => inputRef?.current?.focus()}
                onFocus={() => setPasswordFocused(true)}
              >
                <Label htmlFor="password">Password</Label>
                <Popover open={isPasswordFocused}>
                  <PopoverTrigger asChild>
                    <Input
                      {...field}
                      {...form.register('password', formValidationObject)}
                      required
                      id="password"
                      type="password"
                      placeholder="********"
                      className="rounded-sm"
                      ref={inputRef}
                      onBlur={() => setPasswordFocused(false)}
                      onChange={(e) => field.onChange(e)}
                    />
                  </PopoverTrigger>
                  <PopoverContent className="absolute border-2 bg-white p-2 rounded-md right-60 -bottom-16 flex flex-col">
                    <PasswordValidator password={form.getValues().password} />
                  </PopoverContent>
                </Popover>
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
