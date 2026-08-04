import { isNil } from '@activepieces/core-utils';
import { ApEdition, ApFlagId, HEX_COLOR_PATTERN } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Lock } from 'lucide-react';
import { useRef } from 'react';
import { FieldPath, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { platformApi } from '@/api/platforms-api';
import { RequestTrial } from '@/app/components/request-trial';
import { ColorPicker } from '@/components/custom/color-picker';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useManagePlanDialogStore } from '@/features/billing';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { ImageUploadField, MAX_IMAGE_SIZE_MB } from './image-upload-field';

const BRANDING_GATE_ID = 'branding-plan-gate';

const hexColor = z.string().regex(HEX_COLOR_PATTERN, 'invalidHexColor');

const ThemeColorsSchema = z.object({
  avatar: hexColor,
  'blue-link': hexColor,
  danger: hexColor,
  selection: hexColor,
  primary: z.object({
    dark: hexColor,
    light: hexColor,
    medium: hexColor,
  }),
  warn: z.object({
    default: hexColor,
    light: hexColor,
    dark: hexColor,
  }),
  success: z.object({
    default: hexColor,
    light: hexColor,
  }),
});

const FromSchema = z.object({
  name: z.string(),
  color: z.string(),
  customThemeColors: z.boolean(),
  themeColors: ThemeColorsSchema,
});

type FromSchema = z.infer<typeof FromSchema>;

const THEME_COLOR_FIELDS: { name: FieldPath<FromSchema>; label: string }[] = [
  { name: 'themeColors.primary.dark', label: 'Primary Dark' },
  { name: 'themeColors.primary.light', label: 'Primary Light' },
  { name: 'themeColors.primary.medium', label: 'Primary Medium' },
  { name: 'themeColors.danger', label: 'Danger' },
  { name: 'themeColors.warn.default', label: 'Warning' },
  { name: 'themeColors.warn.light', label: 'Warning Light' },
  { name: 'themeColors.warn.dark', label: 'Warning Dark' },
  { name: 'themeColors.success.default', label: 'Success' },
  { name: 'themeColors.success.light', label: 'Success Light' },
  { name: 'themeColors.blue-link', label: 'Link' },
  { name: 'themeColors.avatar', label: 'Avatar' },
  { name: 'themeColors.selection', label: 'Selection' },
];

export const AppearanceSection = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const branding = flagsHooks.useWebsiteBranding();
  const openManagePlanDialog = useManagePlanDialogStore(
    (state) => state.openDialog,
  );
  const brandingLocked = !platform.plan.customAppearanceEnabled;

  const form = useForm<FromSchema>({
    defaultValues: {
      name: platform?.name,
      color: platform?.primaryColor,
      customThemeColors: !isNil(platform?.themeColors),
      themeColors: {
        avatar: branding.colors.avatar,
        'blue-link': branding.colors['blue-link'],
        danger: branding.colors.danger,
        selection: branding.colors.selection,
        primary: {
          dark: branding.colors.primary.dark,
          light: branding.colors.primary.light,
          medium: branding.colors.primary.medium,
        },
        warn: {
          default: branding.colors.warn.default,
          light: branding.colors.warn.light,
          dark: branding.colors.warn.dark,
        },
        success: {
          default: branding.colors.success.default,
          light: branding.colors.success.light,
        },
      },
    },
    resolver: zodResolver(FromSchema),
    mode: 'onChange',
  });
  const logoRef = useRef<HTMLInputElement>(null);

  const { mutate: updatePlatform, isPending } = useMutation({
    mutationFn: async () => {
      const logo = logoRef.current?.files?.[0];
      const { name, color, customThemeColors, themeColors } = form.getValues();

      const formdata = new FormData();
      formdata.append('name', name);
      if (!brandingLocked) {
        formdata.append('primaryColor', color);
        formdata.append(
          'themeColors',
          customThemeColors ? JSON.stringify(themeColors) : 'null',
        );
        if (logo) formdata.append('fullLogo', logo);
      }

      await platformApi.updateWithFormData(formdata, platform.id);
      window.location.reload();
    },
    onSuccess: () => {
      toast.success(t('Your changes have been saved.'), {
        duration: 3000,
      });
      form.reset(form.getValues());
    },
    onError: () => {
      form.setError('root.serverError', {
        type: 'manual',
        message: t('We could not save your changes. Please try again.'),
      });
      toast.error(t('We could not save your changes. Please try again.'));
    },
  });

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-8"
        onSubmit={form.handleSubmit(() => updatePlatform())}
      >
        {brandingLocked && (
          <BrandingPlanGate onUpgrade={openManagePlanDialog} />
        )}

        <ImageUploadField
          title={t('Platform logo')}
          description={t(
            'Shown in the sidebar and on sign-in. PNG, JPEG or WebP, up to {size}MB.',
            { size: MAX_IMAGE_SIZE_MB },
          )}
          currentUrl={platform?.fullLogoUrl}
          inputRef={logoRef}
          locked={brandingLocked}
          onLocked={openManagePlanDialog}
          previewClassName="h-16 w-32"
        />

        <FormField
          name="name"
          render={({ field }) => (
            <FormItem className="flex max-w-sm flex-col gap-2">
              <FormLabel htmlFor="name">{t('Name')}</FormLabel>
              <Input
                {...field}
                required
                id="name"
                placeholder={t('Platform Name')}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <section className="flex flex-col gap-5">
          <SectionHeader
            title={t('Colors')}
            description={t('Match the interface to your brand palette.')}
          />
          <FormField
            name="color"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2">
                <FormLabel htmlFor="color">{t('Primary Color')}</FormLabel>
                <div className="flex flex-row items-center gap-2">
                  <ColorPicker
                    id="color"
                    aria-label={t('Primary Color')}
                    aria-describedby={
                      brandingLocked ? BRANDING_GATE_ID : undefined
                    }
                    disabled={brandingLocked}
                    value={field.value as string}
                    onChange={(color: string) => field.onChange(color)}
                    className="flex flex-row items-center gap-2"
                  />
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="customThemeColors"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2">
                <FormLabel htmlFor="customThemeColors">
                  {t('Customize theme colors')}
                </FormLabel>
                <Switch
                  id="customThemeColors"
                  aria-describedby={
                    brandingLocked ? BRANDING_GATE_ID : undefined
                  }
                  disabled={brandingLocked}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <FormDescription>
                  {t(
                    'When disabled, theme colors are derived from your primary color.',
                  )}
                </FormDescription>
              </FormItem>
            )}
          />

          {form.watch('customThemeColors') && !brandingLocked && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {THEME_COLOR_FIELDS.map(({ name, label }) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <FormLabel>{t(label)}</FormLabel>
                      <div className="flex flex-row items-center gap-2">
                        <ColorPicker
                          aria-label={t(label)}
                          value={field.value as string}
                          onChange={(color: string) => field.onChange(color)}
                          className="flex flex-row items-center gap-2"
                        />
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          )}
        </section>

        {form?.formState?.errors?.root?.serverError && (
          <FormMessage>
            {form.formState.errors.root.serverError.message}
          </FormMessage>
        )}
        <div className="flex justify-end">
          <Button
            type="submit"
            loading={isPending}
            disabled={!form.formState.isValid}
          >
            {t('Save')}
          </Button>
        </div>
      </form>
    </Form>
  );
};

const SectionHeader = ({ title, description }: SectionHeaderProps) => (
  <div className="flex flex-col gap-0.5">
    <h2 className="text-base font-semibold">{title}</h2>
    <span className="text-sm text-muted-foreground">{description}</span>
  </div>
);

const BrandingPlanGate = ({ onUpgrade }: BrandingPlanGateProps) => {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const isCommunity = edition === ApEdition.COMMUNITY;

  return (
    <div
      id={BRANDING_GATE_ID}
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3"
    >
      <div className="flex items-start gap-3">
        <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">
            {t('Branding is available on paid plans')}
          </span>
          <span className="text-sm text-muted-foreground">
            {t('Upgrade to use your own logo and colors.')}
          </span>
        </div>
      </div>
      {isCommunity ? (
        <RequestTrial featureKey="BRANDING" />
      ) : (
        <Button type="button" size="sm" variant="outline" onClick={onUpgrade}>
          {t('Upgrade')}
        </Button>
      )}
    </div>
  );
};

type SectionHeaderProps = {
  title: string;
  description: string;
};

type BrandingPlanGateProps = {
  onUpgrade: () => void;
};
