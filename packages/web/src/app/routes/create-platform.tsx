import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Navigate } from 'react-router-dom';

import { platformApi } from '@/api/platforms-api';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthLayout } from '@/features/authentication/components/auth-form-template';
import { authenticationSession } from '@/lib/authentication-session';
import { useRedirectAfterLogin } from '@/lib/navigation-utils';

type CreatePlatformSchema = {
  name: string;
};

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
    onError: () => {
      form.setError('root.serverError', {
        message: t('Something went wrong, please try again later'),
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
          }}
          render={({ field }) => (
            <FormItem className="grid space-y-1">
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

  if (!token) {
    return <Navigate to="/sign-in" replace />;
  }

  if (!authenticationSession.isOnboarding()) {
    return <Navigate to="/" replace />;
  }

  return (
    <AuthLayout>
      <div className="mb-6 text-center">
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: "'Sentient', serif" }}
        >
          {t('Create your platform')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('Give your platform a name to get started.')}
        </p>
      </div>
      <CreatePlatformForm />
    </AuthLayout>
  );
}

export { CreatePlatformPage };
