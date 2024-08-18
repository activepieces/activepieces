import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ColorPicker } from '@/components/ui/color-picker';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { platformHooks } from '@/hooks/platform-hooks';
import { platformApi } from '@/lib/platforms-api';
import { localesMap } from '@/lib/utils';

const FromSchema = Type.Object({
  name: Type.String(),
  logoUrl: Type.String(),
  iconUrl: Type.String(),
  faviconUrl: Type.String(),
  language: Type.String(),
  color: Type.String(),
});

type FromSchema = Static<typeof FromSchema>;

export const AppearanceSection = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const locales = Object.entries(localesMap);
  const form = useForm({
    defaultValues: {
      name: platform?.name,
      logoUrl: platform?.fullLogoUrl,
      iconUrl: platform?.logoIconUrl,
      faviconUrl: platform?.favIconUrl,
      language: platform?.defaultLocale,
      color: platform?.primaryColor,
    },
    resolver: typeboxResolver(FromSchema),
  });

  const { toast } = useToast();

  const { mutate: updatePlatform, isPending } = useMutation({
    mutationFn: async () =>
      platformApi.update(
        {
          name: form.getValues().name,
          fullLogoUrl: form.getValues().logoUrl,
          logoIconUrl: form.getValues().iconUrl,
          favIconUrl: form.getValues().faviconUrl,
          defaultLocale: form.getValues().language,
          primaryColor: form.getValues().color,
        },
        platform.id,
      ),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Your changes have been saved.',
        duration: 3000,
      });
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  return (
    <Card className="max-w-[60%]">
      <CardHeader className="pb-3">
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Change the look and feel of your projects.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-1 mt-4">
        <Form {...form}>
          <form className="grid space-y-4" onSubmit={(e) => e.preventDefault()}>
            <FormField
              name="name"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    {...field}
                    required
                    id="name"
                    placeholder="Project Name"
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="logoUrl"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    {...field}
                    required
                    id="logoUrl"
                    placeholder="https://www.example.com/logo.png"
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="iconUrl"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="iconUrl">Icon URL</Label>
                  <Input
                    {...field}
                    required
                    id="iconUrl"
                    placeholder="https://www.example.com/icon.png"
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="faviconUrl"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="faviconUrl">Favicon URL</Label>
                  <Input
                    {...field}
                    required
                    id="faviconUrl"
                    placeholder="https://www.example.com/favicon.png"
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="language"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="language">Default Language</Label>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {locales.length === 0 && (
                          <SelectItem value="NULL">No Languages</SelectItem>
                        )}
                        {locales.map(([locale, name]) => (
                          <SelectItem key={locale} value={locale}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              name="color"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="color">Primary Color</Label>
                  <div className="flex flex-row gap-2 items-center">
                    <ColorPicker
                      defaultValue={field.value as string}
                      onSave={(color) => field.onChange(color)}
                      className="flex flex-row gap-2 items-center"
                    >
                      <Input
                        {...field}
                        value={(field.value as string).toUpperCase()}
                        required
                        id="color"
                        placeholder="#6e41e2"
                        className="rounded-sm"
                        readOnly
                        style={{
                          backgroundColor: (field.value as string) + '3f',
                        }}
                      />
                      <Button
                        className="block rounded-full px-4"
                        size="icon"
                        style={{
                          backgroundColor: field.value as string,
                        }}
                        variant="outline"
                      />
                    </ColorPicker>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {form?.formState?.errors?.root?.serverError && (
              <FormMessage>
                {form.formState.errors.root.serverError.message}
              </FormMessage>
            )}
          </form>
        </Form>
        <div className="flex gap-2 justify-end mt-4">
          <Button
            loading={isPending}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              updatePlatform();
            }}
            disabled={!form.formState.isDirty}
          >
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
