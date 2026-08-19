import { mcpEndpointAllowlistUtil } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { platformApi } from '@/api/platforms-api';
import { TagInput } from '@/components/custom/tag-input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { internalErrorToast } from '@/components/ui/sonner';
import { platformHooks } from '@/hooks/platform-hooks';

const isValidEntry = (value: string): boolean =>
  mcpEndpointAllowlistUtil.isValidEntry(value);

const McpEndpointAllowlistForm = z.object({
  endpoints: z
    .array(z.string())
    .refine((items) => items.every(isValidEntry), 'invalidMcpServerEndpoint'),
});

type McpEndpointAllowlistForm = z.infer<typeof McpEndpointAllowlistForm>;

export const McpEndpointAllowlist = () => {
  const { platform, refetch } = platformHooks.useCurrentPlatform();

  const form = useForm<McpEndpointAllowlistForm>({
    resolver: zodResolver(McpEndpointAllowlistForm),
    defaultValues: { endpoints: platform.mcpServerEndpointAllowlist ?? [] },
    mode: 'onChange',
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: McpEndpointAllowlistForm) => {
      await platformApi.update(
        { mcpServerEndpointAllowlist: values.endpoints },
        platform.id,
      );
      await refetch();
    },
    onSuccess: () => {
      toast.success(t('Approved MCP endpoints updated'));
    },
    onError: () => internalErrorToast(),
  });

  return (
    <div>
      <h3 className="font-semibold text-base mb-1">
        {t('Approved external MCP endpoints')}
      </h3>
      <p className="text-sm text-muted-foreground mb-3">
        {t(
          'Restrict which external MCP servers agents may connect to. When the list is empty, any endpoint is allowed.',
        )}
      </p>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => mutate(values))}
          className="flex flex-col gap-2"
        >
          <FormField
            name="endpoints"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Approved endpoints')}</FormLabel>
                <p className="text-xs text-muted-foreground">
                  {t(
                    'Press Enter or use a comma to add another. Use a host like mcp.acme.com or a wildcard like *.acme.com.',
                  )}
                </p>
                <FormControl>
                  <TagInput
                    value={field.value}
                    onChange={(next) => field.onChange([...next])}
                    validateItem={isValidEntry}
                    invalidBadgeClassName="text-destructive-800 bg-destructive-50 border-destructive-200 dark:text-destructive-200 dark:bg-destructive-900 dark:border-destructive-800"
                    placeholder="mcp.acme.com"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end mt-6">
            <Button size="sm" type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin mr-2" />}
              {t('Save')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
