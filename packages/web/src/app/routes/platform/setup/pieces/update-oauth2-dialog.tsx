import { isNil } from '@activepieces/core-utils';
import { UpsertOAuth2AppRequest } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { Lock, Unlock } from 'lucide-react';
import { useState, forwardRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  ConfirmDialog,
  adminLayout,
  useAdminAction,
} from '@/app/components/admin';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { oauthAppsQueries } from '@/features/connections';
import { oauthAppsApi } from '@/features/connections/api/oauth-apps';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { mutationFeedback } from '@/lib/mutation-feedback';

type ConfigurePieceOAuth2DialogProps = {
  pieceName: string;
  onConfigurationDone: () => void;
  isEnabled: boolean;
};

const OAuth2FormValues = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
});
type OAuth2FormValues = z.infer<typeof OAuth2FormValues>;

export const ConfigurePieceOAuth2Dialog = forwardRef<
  HTMLButtonElement,
  ConfigurePieceOAuth2DialogProps
>(({ pieceName, onConfigurationDone, isEnabled }, ref) => {
  const [open, setOpen] = useState(false);
  const form = useForm<OAuth2FormValues>({
    resolver: zodResolver(OAuth2FormValues),
  });
  const changeOpen = (next: boolean) => {
    if (!next) {
      form.reset();
    }
    setOpen(next);
  };

  const { oauth2App, refetch } =
    oauthAppsQueries.useOAuthAppConfigured(pieceName);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const { mutateAsync: removeOAuth2App, isPending: isDeleting } =
    useAdminAction<string>({
      verb: 'delete',
      name: t('OAuth2 app'),
      run: async (id) => {
        await oauthAppsApi.delete(id);
        await refetch();
      },
      onSuccess: onConfigurationDone,
    });
  const { mutate: upsert, isPending: isUpserting } =
    useAdminAction<UpsertOAuth2AppRequest>({
      verb: 'save',
      run: async (request) => {
        await oauthAppsApi.upsert(request);
        await refetch();
      },
      feedback: 'inline',
      onSuccess: () => {
        onConfigurationDone();
        changeOpen(false);
      },
    });

  return (
    <>
      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogTrigger asChild>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                {...adminControl(
                  isNil(oauth2App)
                    ? AdminControl.PIECES_OAUTH_CONFIGURE_OPEN
                    : AdminControl.PIECES_OAUTH_DELETE_OPEN,
                )}
                ref={ref}
                size={'sm'}
                variant={'ghost'}
                loading={isUpserting || isDeleting}
                disabled={!isEnabled}
                onClick={(e) => {
                  if (!isEnabled) {
                    e.preventDefault();
                    return;
                  }
                  if (isNil(oauth2App)) {
                    setOpen(true);
                  } else {
                    setConfirmingRemove(true);
                  }
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                {isNil(oauth2App) ? (
                  <Unlock className="size-4" />
                ) : (
                  <Lock className="size-4 text-danger-11" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isNil(oauth2App)
                ? t('Configure OAuth2 App')
                : t('Delete OAuth2 App')}
            </TooltipContent>
          </Tooltip>
        </DialogTrigger>
        <DialogContent className={adminLayout.dialog.md}>
          <DialogTitle>{t('Configure OAuth2 App')}</DialogTitle>

          <Form {...form}>
            <form
              className="grid space-y-4 mt-4"
              onSubmit={form.handleSubmit((data) => {
                form.clearErrors('root.serverError');
                upsert(
                  {
                    clientId: data.clientId,
                    clientSecret: data.clientSecret,
                    pieceName,
                  },
                  {
                    onError: (error) =>
                      form.setError('root.serverError', {
                        type: 'manual',
                        message: mutationFeedback.message(error),
                      }),
                  },
                );
              })}
            >
              <FormField
                name="clientId"
                render={({ field }) => (
                  <FormItem className="grid space-y-4">
                    <Label htmlFor="clientId" showRequiredIndicator>
                      {t('Client ID')}
                    </Label>
                    <Input {...field} required id="clientId" />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="clientSecret"
                render={({ field }) => (
                  <FormItem className="grid space-y-4">
                    <Label htmlFor="clientSecret" showRequiredIndicator>
                      {t('Client Secret')}
                    </Label>
                    <Input
                      {...field}
                      required
                      id="clientSecret"
                      type="password"
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

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => changeOpen(false)}
                >
                  {t('Cancel')}
                </Button>
                <Button
                  {...adminControl(AdminControl.PIECES_OAUTH_CONFIGURE_SUBMIT)}
                  loading={isUpserting}
                  disabled={!form.formState.isValid}
                  type="submit"
                >
                  {t('Save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      {oauth2App && (
        <ConfirmDialog
          open={confirmingRemove}
          onOpenChange={setConfirmingRemove}
          title={t('Delete OAuth2 App')}
          description={t(
            'Connections that sign in through this app stop working until it is configured again.',
          )}
          confirmLabel={t('Delete')}
          controlId={AdminControl.PIECES_OAUTH_DELETE_RUN}
          onConfirm={() => removeOAuth2App(oauth2App.id)}
        />
      )}
    </>
  );
});

ConfigurePieceOAuth2Dialog.displayName = 'ConfigurePieceOAuth2Dialog';
