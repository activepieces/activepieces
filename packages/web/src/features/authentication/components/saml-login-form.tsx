import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { samlSsoApi } from '@/features/platform-admin';
import { formatUtils } from '@/lib/format-utils';

const FormValues = z.object({
  email: z.string().regex(formatUtils.emailRegex, t('Email is invalid')),
});

type FormValues = z.infer<typeof FormValues>;

type SamlLoginFormProps = {
  onBack: () => void;
};

export const SamlLoginForm = ({ onBack }: SamlLoginFormProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(FormValues),
    defaultValues: { email: '' },
    mode: 'onChange',
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      const domain = values.email.trim().toLowerCase().split('@')[1];
      const { platformId } = await samlSsoApi.discover(domain);
      if (!platformId) {
        throw new Error(t('No SAML provider found for this domain'));
      }
      window.location.href = `/api/v1/authn/saml/login?platformId=${encodeURIComponent(
        platformId,
      )}`;
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : t('Sign-in failed');
      form.setError('root.serverError', { type: 'manual', message });
    },
  });

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((data) => {
          form.clearErrors('root.serverError');
          mutate(data);
        })}
      >
        <p className="text-sm text-muted-foreground">
          {t('Enter your email to be redirected to your SAML provider.')}
        </p>
        <FormField
          name="email"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1.5">
              <FormLabel>{t('Email')}</FormLabel>
              <Input
                {...field}
                type="text"
                placeholder="jdoe@acme.com"
                className="rounded-sm"
                autoFocus
              />
              <FormMessage />
            </FormItem>
          )}
        />
        {form.formState.errors.root?.serverError && (
          <FormMessage>
            {form.formState.errors.root.serverError.message}
          </FormMessage>
        )}
        <Button
          type="submit"
          loading={isPending}
          disabled={!form.formState.isValid}
        >
          {t('Continue')}
        </Button>
        <Button variant="ghost" type="button" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('Back to sign in')}
        </Button>
      </form>
    </Form>
  );
};
