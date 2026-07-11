import { SAFE_STRING_PATTERN } from '@activepieces/core-utils';
import { ApEdition, ApFlagId, formErrors } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { HttpStatusCode } from 'axios';
import { t } from 'i18next';
import { Sparkles } from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Navigate } from 'react-router-dom';
import { z } from 'zod';

import { platformApi } from '@/api/platforms-api';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AuthLayout } from '@/features/authentication/components/auth-form-template';
import { personalizationApi } from '@/features/chat/lib/personalization-api';
import { flagsHooks } from '@/hooks/flags-hooks';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { commonRoles } from '@/lib/common-roles';
import { companyDomainUtils } from '@/lib/company-domain-utils';
import { useRedirectAfterLogin } from '@/lib/navigation-utils';

function ConfirmWebsiteForm() {
  const redirectAfterLogin = useRedirectAfterLogin();
  const email = authenticationSession.getCurrentUserEmail();
  const companyDomain = email
    ? companyDomainUtils.companyDomainFromEmail(email)
    : null;

  const form = useForm<ConfirmWebsiteSchema>({
    resolver: zodResolver(ConfirmWebsiteZodSchema),
    defaultValues: {
      website: companyDomain ?? '',
      role: '',
      personalize: true,
    },
    mode: 'onChange',
  });

  const personalize = form.watch('personalize');
  const website = form.watch('website');
  const normalizedWebsite = companyDomainUtils.normalizeWebsite(website);
  const derivedName = companyDomainUtils.deriveWorkspaceName({
    website: personalize ? normalizedWebsite : null,
    email,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: platformApi.createPlatform,
    onSuccess: (data) => {
      authenticationSession.saveResponse(data, false);
      // Fire-and-forget on purpose (raw promise, not useMutation — the global
      // MutationCache.onError would toast): personalization must never block
      // or break entry into the app.
      // Trust the toggle: when personalization is on, always send
      // personalize:true. The server resolves the domain from the website when
      // present, else falls back to the work-email domain — never silently
      // downgrade to skipped just because the website field was left blank.
      const wantsPersonalization = form.getValues('personalize');
      const site = wantsPersonalization
        ? companyDomainUtils.normalizeWebsite(form.getValues('website'))
        : null;
      const role = form.getValues('role').trim();
      personalizationApi
        .start({
          ...(site ? { website: site } : {}),
          ...(wantsPersonalization && role ? { role } : {}),
          personalize: wantsPersonalization,
        })
        .catch(() => {});
      // A fresh workspace opens with the sidebar collapsed so the chat (and
      // the personalization journey) is the hero — sidebar_state persists
      // per-browser, so a previous account's preference would leak in.
      localStorage.setItem('sidebar_state', 'false');
      redirectAfterLogin();
    },
    onError: () => {
      form.setError('root.serverError', {
        message: t('Something went wrong, please try again later'),
      });
    },
  });

  const onSubmit: SubmitHandler<ConfirmWebsiteSchema> = () => {
    form.clearErrors('root.serverError');
    mutate({ name: derivedName });
  };

  return (
    <Form {...form}>
      <form className="grid space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="personalize"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between gap-4 space-y-0">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 shrink-0 text-primary" />
                <Label
                  htmlFor="personalize"
                  className="cursor-pointer font-medium"
                >
                  {t('Personalize my experience')}
                </Label>
              </div>
              <Switch
                id="personalize"
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-label={t('Personalize my experience')}
              />
            </FormItem>
          )}
        />

        {personalize && (
          <>
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="companyWebsite">
                    {t('Company website')}
                    <span className="text-destructive"> *</span>
                  </Label>
                  <Input
                    {...field}
                    id="companyWebsite"
                    type="text"
                    placeholder={t('yourcompany.com')}
                    className="rounded-sm"
                    autoFocus
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="userRole">
                    {t('Your role')}
                    <span className="text-destructive"> *</span>
                  </Label>
                  <Input
                    {...field}
                    id="userRole"
                    type="text"
                    placeholder={t('e.g. Head of Sales')}
                    autoComplete="off"
                    className="rounded-sm"
                  />
                  <RoleSuggestionChips
                    query={field.value}
                    onPick={(role) => field.onChange(role)}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <p className="text-xs text-muted-foreground">
          {t('Your workspace will be called {name}', { name: derivedName })}
        </p>
        {form?.formState?.errors?.root?.serverError && (
          <FormMessage>
            {form.formState.errors.root.serverError.message}
          </FormMessage>
        )}
        <Button type="submit" loading={isPending}>
          {t('Continue')}
        </Button>
      </form>
    </Form>
  );
}

// Suggestion chips below the role input — clearly part of the product (unlike
// a native datalist, which reads as browser autofill) and never clips, since
// they flow inline rather than overlay. Hidden once the typed value already
// matches a suggestion exactly, so a picked value doesn't keep nagging.
function RoleSuggestionChips({
  query,
  onPick,
}: {
  query: string;
  onPick: (role: string) => void;
}) {
  const suggestions = commonRoles.suggestRoles({ query, limit: 6 });
  const alreadyMatches =
    suggestions.length === 1 &&
    suggestions[0].toLowerCase() === query.trim().toLowerCase();
  if (suggestions.length === 0 || alreadyMatches) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {suggestions.map((role) => (
        <button
          key={role}
          type="button"
          onClick={() => onPick(role)}
          className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
        >
          {role}
        </button>
      ))}
    </div>
  );
}

function CreatePlatformForm() {
  const redirectAfterLogin = useRedirectAfterLogin();
  const form = useForm<CreatePlatformSchema>({
    defaultValues: {
      name: '',
    },
    mode: 'onChange',
  });

  const { mutate, isPending } = useMutation({
    mutationFn: platformApi.createPlatform,
    onSuccess: (data) => {
      authenticationSession.saveResponse(data, false);
      redirectAfterLogin();
    },
    onError: (error) => {
      const isBadRequest =
        api.isError(error) &&
        error.response?.status === HttpStatusCode.BadRequest;
      form.setError('root.serverError', {
        message: isBadRequest
          ? t('Platform name cannot contain "." or "/"')
          : t('Something went wrong, please try again later'),
      });
    },
  });

  const onSubmit: SubmitHandler<CreatePlatformSchema> = (data) => {
    form.clearErrors('root.serverError');
    mutate({ name: data.name.trim() });
  };

  return (
    <Form {...form}>
      <form className="grid space-y-4">
        <FormField
          control={form.control}
          name="name"
          rules={{
            required: t('Platform name is required'),
            maxLength: {
              value: 100,
              message: t('Platform name is too long'),
            },
            pattern: {
              value: new RegExp(SAFE_STRING_PATTERN),
              message: t('Platform name cannot contain "." or "/"'),
            },
          }}
          render={({ field }) => (
            <FormItem className="grid space-y-2">
              <Label htmlFor="platformName">{t('Platform Name')}</Label>
              <Input
                {...field}
                required
                id="platformName"
                type="text"
                placeholder={t('My Platform')}
                className="rounded-sm"
                autoFocus
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
          {t('Create Platform')}
        </Button>
      </form>
    </Form>
  );
}

function CreatePlatformPage() {
  const token = authenticationSession.getToken();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  if (!token) {
    return <Navigate to="/sign-in" replace />;
  }

  if (!authenticationSession.isOnboarding()) {
    return <Navigate to="/" replace />;
  }

  const isCloud = edition === ApEdition.CLOUD;

  return (
    <AuthLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight font-sentient">
          {isCloud
            ? t('Confirm your company website')
            : t('Create your platform')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isCloud
            ? t(
                "We'll tailor your workspace to what your company does. You can skip this.",
              )
            : t('Give your platform a name to get started.')}
        </p>
      </div>
      {isCloud ? <ConfirmWebsiteForm /> : <CreatePlatformForm />}
    </AuthLayout>
  );
}

// Website and role are required only while the personalize toggle keeps them
// on screen — turning the toggle off is the skip.
const ConfirmWebsiteZodSchema = z
  .object({
    website: z.string().trim(),
    role: z.string().trim().max(120, 'Your role is too long'),
    personalize: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (!value.personalize) {
      return;
    }
    if (companyDomainUtils.normalizeWebsite(value.website) === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['website'],
        message: 'Please enter a valid website, like acme.com',
      });
    }
    if (value.role.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['role'],
        message: formErrors.required,
      });
    }
  });

type ConfirmWebsiteSchema = z.infer<typeof ConfirmWebsiteZodSchema>;

type CreatePlatformSchema = {
  name: string;
};

export { CreatePlatformPage };
