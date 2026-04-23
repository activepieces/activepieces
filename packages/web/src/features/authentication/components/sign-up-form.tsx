import {
  OtpType,
  ApEdition,
  ApFlagId,
  ErrorCode,
  isNil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Eye, EyeOff } from 'lucide-react';
import { useMemo, useState } from 'react';
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
  PopoverAnchor,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
} from '@/components/ui/popover';
import { CheckEmailNote } from '@/features/authentication/components/check-email-note';
import {
  PasswordRequirementsList,
  PasswordStrengthBolt,
} from '@/features/authentication/components/password-validator';
import { flagsHooks } from '@/hooks/flags-hooks';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/format-utils';
import { useRedirectAfterLogin } from '@/lib/navigation-utils';
import { cn } from '@/lib/utils';

import { authMutations } from '../hooks/auth-hooks';
import { passwordValidation } from '../utils/password-validation-utils';

const SignUpForm = ({
  showCheckYourEmailNote,
  setShowCheckYourEmailNote,
}: {
  showCheckYourEmailNote: boolean;
  setShowCheckYourEmailNote: (value: boolean) => void;
}) => {
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const { data: termsOfServiceUrl } = flagsHooks.useFlag<string>(
    ApFlagId.TERMS_OF_SERVICE_URL
  );
  const { data: privacyPolicyUrl } = flagsHooks.useFlag<string>(
    ApFlagId.PRIVACY_POLICY_URL
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

  const { mutate, isPending } = authMutations.useSignUp({
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
                'Sign up is restricted. You need an invitation to join. Please contact the administrator.'
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
                <FormItem className="w-full grid space-y-1">
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
                <FormItem className="w-full grid space-y-1">
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
              <FormItem className="grid space-y-1">
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
              <FormItem className="grid space-y-1">
                <Label htmlFor="password">{t('Password')}</Label>
                <Popover open={isPasswordFocused}>
                  <PopoverAnchor asChild>
                    <div className="relative flex items-center">
                      <Input
                        {...field}
                        required
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={'********'}
                        className="rounded-sm pr-16"
                        data-testid="sign-up-password"
                        onFocus={() => setIsPasswordFocused(true)}
                        onBlur={() => setIsPasswordFocused(false)}
                      />
                      <div className="absolute right-1 flex items-center gap-0.5">
                        <PasswordStrengthBolt password={field.value ?? ''} />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          tabIndex={-1}
                          onClick={() => setShowPassword((v) => !v)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </PopoverAnchor>
                  <PopoverContent
                    side="right"
                    align="center"
                    sideOffset={6}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    className="w-auto shadow-none"
                  >
                    <div className="absolute -left-[4.5px] top-1/2 -translate-y-1/2">
                      <div className="w-2.5 h-2.5 rotate-45 bg-popover border-l border-b border-border" />
                    </div>
                    <PopoverHeader className="mb-2">
                      <PopoverTitle className="text-xs">
                        {t('Password Requirements')}
                      </PopoverTitle>
                    </PopoverHeader>
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
          {showNewsLetterCheckbox && (
            <FormField
              control={form.control}
              name="newsLetter"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 ">
                  <FormControl>
                    <Checkbox
                      id="newsLetter"
                      className="m-0!"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    ></Checkbox>
                  </FormControl>
                  <Label htmlFor="newsLetter" className="text-xs">
                    {t(`Get emails about updates and newsletters`)}
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
    </>
  );
};

SignUpForm.displayName = 'SignUp';

export { SignUpForm };

type SignUpSchema = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  newsLetter: boolean;
};
