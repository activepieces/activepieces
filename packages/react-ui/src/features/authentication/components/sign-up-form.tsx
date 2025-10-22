import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useMemo, useRef, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { CheckEmailNote } from '@/features/authentication/components/check-email-note';
import { PasswordValidator } from '@/features/authentication/components/password-validator';
import { flagsHooks } from '@/hooks/flags-hooks';
import { HttpError, api } from '@/lib/api';
import { authenticationApi } from '@/lib/authentication-api';
import { authenticationSession } from '@/lib/authentication-session';
import { useRedirectAfterLogin } from '@/lib/navigation-utils';
import { cn, formatUtils } from '@/lib/utils';
import { OtpType } from '@activepieces/ee-shared';
import {
  ApEdition,
  ApFlagId,
  AuthenticationResponse,
  ErrorCode,
  isNil,
  SignUpRequest,
} from '@activepieces/shared';

import { passwordValidation } from '../lib/password-validation-utils';

type SignUpSchema = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  newsLetter: boolean;
};

const SignUpForm = ({
  showCheckYourEmailNote,
  setShowCheckYourEmailNote,
}: {
  showCheckYourEmailNote: boolean;
  setShowCheckYourEmailNote: (value: boolean) => void;
}) => {
  const [searchParams] = useSearchParams();
  const { data: termsOfServiceUrl } = flagsHooks.useFlag<string>(
    ApFlagId.TERMS_OF_SERVICE_URL,
  );
  const { data: privacyPolicyUrl } = flagsHooks.useFlag<string>(
    ApFlagId.PRIVACY_POLICY_URL,
  );

  const form = useForm<SignUpSchema>({
    defaultValues: {
      newsLetter: false,
      password: '',
      email: searchParams.get('email') || '',
    },
  });
  const websiteName = flagsHooks.useWebsiteBranding()?.websiteName;
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
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

  const redirectAfterLogin = useRedirectAfterLogin();

  const { mutate, isPending } = useMutation<
    AuthenticationResponse,
    HttpError,
    SignUpRequest
  >({
    mutationFn: authenticationApi.signUp,
    onSuccess: (data) => {
      if (data.verified) {
        authenticationSession.saveResponse(data, false);
        redirectAfterLogin();
      } else {
        setShowCheckYourEmailNote(true);
      }
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
          case ErrorCode.EMAIL_IS_NOT_VERIFIED: {
            setShowCheckYourEmailNote(true);
            break;
          }
          case ErrorCode.INVITATION_ONLY_SIGN_UP: {
            form.setError('root.serverError', {
              message: t(
                'Sign up is restricted. You need an invitation to join. Please contact the administrator.',
              ),
            });
            break;
          }
          case ErrorCode.EXISTING_USER: {
            form.setError('root.serverError', {
              message: t('Email is already used'),
            });
            break;
          }
          case ErrorCode.EMAIL_AUTH_DISABLED: {
            form.setError('root.serverError', {
              message: t('Email authentication is disabled'),
            });
            break;
          }
          case ErrorCode.DOMAIN_NOT_ALLOWED: {
            form.setError('root.serverError', {
              message: t('Email domain is disallowed'),
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
      }
    },
  });

  const onSubmit: SubmitHandler<SignUpSchema> = (data) => {
    form.setError('root.serverError', {
      message: undefined,
    });
    mutate({
      ...data,
      email: data.email.trim().toLowerCase(),
      trackEvents: true,
    });
  };

  const [isPasswordFocused, setPasswordFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return showCheckYourEmailNote ? (
    <div className="pt-6">
      <CheckEmailNote
        email={form.getValues().email.trim().toLowerCase()}
        type={OtpType.EMAIL_VERIFICATION}
      />
    </div>
  ) : (
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
                    data-testid="sign-up-first-name"
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
                    data-testid="sign-up-last-name"
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
                formatUtils.emailRegex.test(email) || t('Email is invalid'),
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
                  data-testid="sign-up-email"
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
                onFocus={() => {
                  setPasswordFocused(true);
                  setTimeout(() => inputRef?.current?.focus());
                }}
                onBlur={() => setPasswordFocused(false)}
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
                      data-testid="sign-up-password"
                      onChange={(e) => field.onChange(e)}
                    />
                  </PopoverTrigger>
                  <PopoverContent className="absolute border-2 bg-background p-2 !pointer-events-none rounded-md right-60 -bottom-16 flex flex-col">
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
                  <Label htmlFor="newsLetter">
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
            data-testid="sign-up-button"
          >
            {t('Sign up')}
          </Button>
        </form>
      </Form>

      {edition === ApEdition.CLOUD && (
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
      )}
    </>
  );
};

SignUpForm.displayName = 'SignUp';

export { SignUpForm };
