import { isNil } from '@activepieces/core-utils';
import {
  brandColors,
  formErrors,
  HEX_COLOR_PATTERN,
  ThemeHexColor,
  PlatformThemeColors,
  StatusColors,
  StatusScale,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { platformApi } from '@/api/platforms-api';
import { FeatureBanner } from '@/app/components/feature-banner';
import { ColorPicker } from '@/components/custom/color-picker';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemTitle,
} from '@/components/ui/item';
import { Label } from '@/components/ui/label';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { brandSeed } from '@/lib/brand-seed';

import { ColorPreview, ColorTone } from './color-preview';

export const AppearanceSection = () => {
  const queryClient = useQueryClient();
  const { platform } = platformHooks.useCurrentPlatform();
  const branding = flagsHooks.useWebsiteBranding();
  const brandingLocked = !platform.plan.customAppearanceEnabled;
  const initialColor = HEX_COLOR_PATTERN.test(platform.primaryColor)
    ? platform.primaryColor
    : branding.colors.primary.default;

  const storedStatusColors = brandingLocked
    ? branding.statusColors
    : platform.themeColors?.status;

  const form = useForm<PlatformAppearanceSchema>({
    defaultValues: {
      name: platform.name,
      color: initialColor,
      statusColors: {
        danger: storedStatusColors?.danger,
        warning: storedStatusColors?.warning,
        success: storedStatusColors?.success,
      },
    },
    resolver: zodResolver(
      brandingLocked
        ? PlatformAppearanceSchema.extend({ color: z.string() })
        : PlatformAppearanceSchema,
    ),
    mode: 'onChange',
  });

  const previewColor = form.watch('color');
  const [previewDanger, previewWarning, previewSuccess] = form.watch([
    'statusColors.danger',
    'statusColors.warning',
    'statusColors.success',
  ]);
  const savedColor = branding.colors.primary.default;

  useEffect(() => {
    if (brandingLocked) {
      return;
    }
    brandSeed.setPreview({
      primaryColor: HEX_COLOR_PATTERN.test(previewColor)
        ? previewColor
        : savedColor,
      statusColors: {
        danger: previewDanger,
        warning: previewWarning,
        success: previewSuccess,
      },
    });
    return () => brandSeed.clearPreview();
  }, [
    brandingLocked,
    previewColor,
    previewDanger,
    previewWarning,
    previewSuccess,
    savedColor,
  ]);

  const statusLabels: Record<StatusScale, string> = {
    danger: t('Danger'),
    warning: t('Warning'),
    success: t('Success'),
  };

  const [fileInputsKey, setFileInputsKey] = useState(0);
  const [hasChosenFiles, setHasChosenFiles] = useState(false);
  const { isDirty, errors } = form.formState;
  const hasFieldErrors = Object.keys(errors).some((field) => field !== 'root');
  const hasChanges = isDirty || hasChosenFiles;
  const clearChosenFiles = () => {
    setHasChosenFiles(false);
    setFileInputsKey((key) => key + 1);
  };

  const logoRef = useRef<HTMLInputElement>(null);
  const iconRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  const { mutate: updatePlatform, isPending } = useMutation({
    mutationFn: async () => {
      form.clearErrors('root.serverError');
      const logo = logoRef.current?.files?.[0];
      const icon = iconRef.current?.files?.[0];
      const favicon = faviconRef.current?.files?.[0];
      const { name, color, statusColors } = form.getValues();

      const formdata = new FormData();
      formdata.append('name', name);
      if (!brandingLocked) {
        if (color !== initialColor) {
          formdata.append('primaryColor', color);
        }
        formdata.append(
          'themeColors',
          JSON.stringify(
            withStatusColors({
              themeColors: platform.themeColors,
              statusColors,
            }),
          ),
        );
        if (logo) formdata.append('fullLogo', logo);
        if (icon) formdata.append('logoIcon', icon);
        if (favicon) formdata.append('favIcon', favicon);
      }

      await platformApi.updateWithFormData(formdata, platform.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['platform', platform.id] }),
        queryClient.invalidateQueries({ queryKey: flagsHooks.queryKey }),
      ]);
    },
    onSuccess: () => {
      clearChosenFiles();
      toast.success(t('Your changes have been saved.'), { duration: 3000 });
      form.reset(form.getValues());
    },
    onError: () => {
      form.setError('root.serverError', {
        type: 'manual',
        message: t('Failed to save changes. Please try again.'),
      });
    },
  });

  return (
    <div className="grid gap-4">
      <Form {...form}>
        <form
          className="grid space-y-4 mt-4"
          onSubmit={form.handleSubmit(() => updatePlatform())}
        >
          <div className="max-w-[600px] grid space-y-4">
            <FormField
              name="name"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <FormLabel htmlFor="name">{t('Platform Name')}</FormLabel>
                  <Input
                    {...field}
                    required
                    id="name"
                    placeholder={t('Platform Name')}
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {brandingLocked && (
              <FeatureBanner
                message={t(
                  'Your logo, colors and favicon are part of custom branding.',
                )}
              />
            )}

            <div className="grid space-y-2">
              <Label htmlFor="logoFile">{t('Logo')}</Label>
              <Input
                type="file"
                key={fileInputsKey}
                ref={logoRef}
                onChange={() => setHasChosenFiles(true)}
                defaultFileName={platform.fullLogoUrl}
                accept="image/*"
                id="logoFile"
                disabled={brandingLocked}
                className="rounded-sm"
              />
            </div>
            <div className="grid space-y-2">
              <Label htmlFor="iconFile">{t('Icon')}</Label>
              <Input
                type="file"
                key={fileInputsKey}
                ref={iconRef}
                onChange={() => setHasChosenFiles(true)}
                defaultFileName={platform.logoIconUrl}
                accept="image/*"
                id="iconFile"
                disabled={brandingLocked}
                className="rounded-sm"
              />
            </div>
            <div className="grid space-y-2">
              <Label htmlFor="faviconFile">{t('Favicon')}</Label>
              <Input
                type="file"
                key={fileInputsKey}
                ref={faviconRef}
                onChange={() => setHasChosenFiles(true)}
                defaultFileName={platform.favIconUrl}
                accept="image/*"
                id="faviconFile"
                disabled={brandingLocked}
                className="rounded-sm"
              />
            </div>

            <Item variant="outline">
              <ItemContent>
                <ItemTitle>{t('Colors')}</ItemTitle>
                <ItemDescription>
                  {t('Your brand and status colors.')}
                </ItemDescription>
              </ItemContent>
              <ItemFooter className="@container block">
                <div className="grid grid-cols-1 gap-3 @lg:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <ColorRow
                        tone="primary"
                        label={t('Primary')}
                        color={field.value}
                        defaultColor={brandColors.defaultPrimaryColor()}
                        isDefault={
                          field.value.toLowerCase() ===
                          brandColors.defaultPrimaryColor()
                        }
                        disabled={brandingLocked}
                        onChange={field.onChange}
                        onReset={() =>
                          field.onChange(brandColors.defaultPrimaryColor())
                        }
                      />
                    )}
                  />
                  {brandColors.statusScales.map((scale) => (
                    <FormField
                      key={scale}
                      control={form.control}
                      name={`statusColors.${scale}`}
                      render={({ field }) => (
                        <ColorRow
                          tone={scale}
                          label={statusLabels[scale]}
                          color={field.value}
                          defaultColor={brandColors.defaultStatusColor({
                            scale,
                          })}
                          isDefault={isNil(field.value)}
                          disabled={brandingLocked}
                          onChange={field.onChange}
                          onReset={() => field.onChange(undefined)}
                        />
                      )}
                    />
                  ))}
                </div>
              </ItemFooter>
            </Item>

            {form?.formState?.errors?.root?.serverError && (
              <FormMessage>
                {form.formState.errors.root.serverError.message}
              </FormMessage>
            )}
            <div className="flex items-center justify-between gap-3 pt-2">
              <span className="text-sm text-gray-11">
                {hasChanges && (
                  <span className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-warning-9" />
                    {t('You have unsaved changes')}
                  </span>
                )}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!hasChanges || isPending}
                  onClick={() => {
                    form.reset();
                    clearChosenFiles();
                  }}
                >
                  {t('Cancel')}
                </Button>
                <Button
                  type="submit"
                  loading={isPending}
                  disabled={!hasChanges || hasFieldErrors}
                >
                  {t('Save')}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

const ColorRow = ({
  tone,
  label,
  color,
  defaultColor,
  isDefault,
  disabled,
  onChange,
  onReset,
}: ColorRowProps) => {
  const shownColor = color ?? defaultColor;
  return (
    <FormItem className="flex flex-col gap-3 space-y-0 rounded-lg border border-gray-6 p-3">
      <div className="flex items-center gap-3">
        <ColorPicker
          side="top"
          aria-label={label}
          disabled={disabled}
          value={shownColor}
          onChange={onChange}
          className="shrink-0"
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <FormLabel className="font-normal">{label}</FormLabel>
          <span className="text-xs text-gray-11">
            <span className="font-mono uppercase">{shownColor}</span>
            {isDefault && ` · ${t('Default')}`}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={t('Reset {name}', { name: label })}
          disabled={disabled || isDefault}
          onClick={onReset}
        >
          {t('Reset')}
        </Button>
      </div>
      <FormMessage />
      <ColorPreview tone={tone} />
    </FormItem>
  );
};

function withStatusColors({
  themeColors,
  statusColors,
}: {
  themeColors: PlatformThemeColors | null | undefined;
  statusColors: StatusColors;
}): PlatformThemeColors {
  const hasStatusColor = Object.values(statusColors).some(
    (color) => !isNil(color),
  );
  return {
    ...themeColors,
    status: hasStatusColor ? statusColors : undefined,
  };
}

const PlatformAppearanceSchema = z.object({
  name: z.string().min(1, formErrors.required),
  color: ThemeHexColor,
  statusColors: PlatformThemeColors.shape.status.unwrap(),
});

type PlatformAppearanceSchema = z.infer<typeof PlatformAppearanceSchema>;

type ColorRowProps = {
  tone: ColorTone;
  label: string;
  color: string | undefined;
  defaultColor: string;
  isDefault: boolean;
  disabled: boolean;
  onChange: (color: string | undefined) => void;
  onReset: () => void;
};
