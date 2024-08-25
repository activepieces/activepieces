import { Static, Type } from '@sinclair/typebox';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { HttpStatusCode } from 'axios';
import { t } from 'i18next';
import { Check, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
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
  ApEdition,
  ApFlagId,
  AuthenticationResponse,
  SignUpRequest,
} from '@activepieces/shared';

import {
  emailRegex,
  passwordRules,
  passwordValidation,
} from '../lib/password-validation-utils';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const SignUpSchema = Type.Object({
  firstName: Type.String({
    minLength: 1,
    errorMessage: t('First name is required'),
  }),
  lastName: Type.String({
    minLength: 1,
    errorMessage: t('Last name is required'),
  }),
  email: Type.String({
    errorMessage: t('Email is invalid'),
    pattern: emailRegex.source,
  }),
  password: Type.String({
    minLength: 1,
    errorMessage: t('Password is required'),
  }),
  trackEvents: Type.Boolean(),
  newsLetter: Type.Boolean(),
});

type SignUpSchema = Static<typeof SignUpSchema>;

const PasswordValidator = ({ password }: { password: string }) => {
  return (
    <>
      {passwordRules.map((rule, index) => {
        return (
          <div key={index} className="flex flex-row gap-2">
            {rule.condition(password) ? (
              <Check className="text-success" />
            ) : (
              <X className="text-destructive" />
            )}
            <span>{t(rule.label)}</span>
          </div>
        );
      })}
    </>
  );
};

const SignUpForm: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

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
  });
  const websiteName = flagsHooks.useWebsiteBranding(queryClient)?.websiteName;
  const edition = flagsHooks.useFlag<ApEdition>(
    ApFlagId.EDITION,
    queryClient,
  ).data;
  const showNewsLetterCheckbox = useMemo(() => {
    if (!edition || !websiteName) {
      return false;
    }
    switch (edition) {
      case ApEdition.CLOUD: {
        if (
          typeof websiteName === 'string' &&
          websiteName.toLowerCase() === 'activepieces'
        ) {
          form.setValue('newsLetter', true);
          return true;
        }
        return false;
      }
      case ApEdition.ENTERPRISE:
        return false;
      case ApEdition.COMMUNITY: {
        form.setValue('newsLetter', true);
        return true;
      }
    }
  }, [edition, websiteName]);
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
              message: t('Email is already used'),
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

  const onSubmit: SubmitHandler<SignUpRequest> = (data) => {
    form.setError('root.serverError', {
      message: undefined,
    });
    mutate({ ...data, email: data.email.trim().toLowerCase() });
  };

  const [isPasswordFocused, setPasswordFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <Form {...form}>
        <form className="grid space-y-4">
          <div className={'flex flex-row gap-2'}>
            <FormField
              control={form.control}
              name="firstName"
              rules={{
                required: t('First name is required'),
              }}
              render={({ field }) => (
                <FormItem className="w-full grid space-y-2">
                  <Label htmlFor="firstName">{t('First Name')}</Label>
                  <Input
                    {...field}
                    required
                    id="firstName"
                    type="text"
                    placeholder={'John'}
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              rules={{
                required: t('Last name is required'),
              }}
              render={({ field }) => (
                <FormItem className="w-full grid space-y-2">
                  <Label htmlFor="lastName">{t('Last Name')}</Label>
                  <Input
                    {...field}
                    required
                    id="lastName"
                    type="text"
                    placeholder={'Doe'}
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
            rules={{
              required: t('Email is required'),
              validate: (email: string) =>
                emailRegex.test(email) || t('Email is invalid'),
            }}
            render={({ field }) => (
              <FormItem className="grid space-y-2">
                <Label htmlFor="email">{t('Email')}</Label>
                <Input
                  {...field}
                  required
                  id="email"
                  type="email"
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
            rules={{
              required: t('Password is required'),
              validate: passwordValidation,
            }}
            render={({ field }) => (
              <FormItem
                className="grid space-y-2"
                onClick={() => inputRef?.current?.focus()}
                onFocus={() => setPasswordFocused(true)}
              >
                <Label htmlFor="password">{t('Password')}</Label>
                <Popover open={isPasswordFocused}>
                  <PopoverTrigger asChild>
                    <Input
                      {...field}
                      required
                      id="password"
                      type="password"
                      placeholder={'********'}
                      className="rounded-sm"
                      ref={inputRef}
                      onBlur={() => setPasswordFocused(false)}
                      onChange={(e) => field.onChange(e)}
                    />
                  </PopoverTrigger>
                  <PopoverContent className="absolute border-2 bg-background p-2 rounded-md right-60 -bottom-16 flex flex-col">
                    <PasswordValidator password={form.getValues().password} />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          {showNewsLetterCheckbox && (
            <FormField
              control={form.control}
              name="newsLetter"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 ">
                  <FormControl>
                    <Checkbox
                      id="newsLetter"
                      className="!m-0"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    ></Checkbox>
                  </FormControl>
                  <Label htmlFor="newsLetter" className="cursor-pointer">
                    {t(`Receive updates and newsletters from activepieces`)}
                  </Label>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {form?.formState?.errors?.root?.serverError && (
            <FormMessage>
              {form.formState.errors.root.serverError.message}
            </FormMessage>
          )}
          <Button
            loading={isPending}
            onClick={(e) => form.handleSubmit(onSubmit)(e)}
          >
            {t('Sign up')}
          </Button>
        </form>
      </Form>

      <div
        className={cn('text-center text-sm', {
          'mt-4': termsOfServiceUrl || privacyPolicyUrl,
        })}
      >
        {(termsOfServiceUrl || privacyPolicyUrl) &&
          t('By creating an account, you agree to our')}
        {termsOfServiceUrl && (
          <Link
            to={termsOfServiceUrl || ''}
            target="_blank"
            className="px-1 text-muted-foreground hover:text-primary text-sm transition-all duration-200"
          >
            {t('terms of service')}
          </Link>
        )}
        {termsOfServiceUrl && privacyPolicyUrl && t('and')}
        {privacyPolicyUrl && (
          <Link
            to={privacyPolicyUrl || ''}
            target="_blank"
            className="pl-1 text-muted-foreground hover:text-primary text-sm transition-all duration-200"
          >
            {t('privacy policy')}
          </Link>
        )}
        .
      </div>
      <div className="mt-4 text-center text-sm">
        {t('Have an account?')}
        <Link
          to="/sign-in"
          className="pl-1 text-muted-foreground hover:text-primary text-sm transition-all duration-200"
        >
          {t('Sign in')}
        </Link>
      </div>
    </>
  );
};

SignUpForm.displayName = 'SignUp';

export { SignUpForm };
