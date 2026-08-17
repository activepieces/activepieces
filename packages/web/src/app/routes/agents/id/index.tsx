import { unique } from '@activepieces/core-utils';
import {
  Agent,
  AgentConfig,
  AgentToolType,
  DEFAULT_AGENT_MAX_STEPS,
  MAX_AGENT_STEP_BUDGET,
  PROJECT_COLOR_PALETTE,
  UpdateAgentRequest,
  formErrors,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { Settings2, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { z } from 'zod';

import { AgentTools } from '@/app/builder/step-settings/agent-settings/agent-tools';
import { LockedFeatureGuard } from '@/app/components/locked-feature-guard';
import { AIChatBox } from '@/app/routes/chat-with-ai/ai-chat-box';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AIModelSelector, AgentStructuredOutput } from '@/features/agents';
import { AgentChatWelcome } from '@/features/agents/agent-chat-welcome';
import { AgentMark } from '@/features/agents/agent-mark';
import {
  agentsMutations,
  agentsQueries,
} from '@/features/agents/hooks/agents-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

const ConfigureAgentSchema = z.object({
  displayName: z.string().min(1, formErrors.required),
  description: z.string(),
  draft: AgentConfig,
});

type ConfigureAgentInput = z.input<typeof ConfigureAgentSchema>;
type ConfigureAgentValues = z.output<typeof ConfigureAgentSchema>;

const toUpdateRequest = (values: ConfigureAgentValues): UpdateAgentRequest => ({
  displayName: values.displayName,
  description: values.description.length > 0 ? values.description : null,
  draft: values.draft,
});

const parseProvider = (provider?: string) => {
  const parsed = AgentConfig.shape.provider.safeParse(provider ?? null);
  return parsed.success ? parsed.data : null;
};

const buildCapabilityNote = (agent: Agent): string => {
  const toolNames = unique(
    agent.draft.tools.map((tool) =>
      tool.type === AgentToolType.PIECE
        ? pieceDisplayName(tool.pieceMetadata.pieceName)
        : tool.toolName,
    ),
  );
  if (toolNames.length === 0) {
    return t('{name} has no tools yet, so replies may need review', {
      name: agent.displayName,
    });
  }
  return t('{name} can use {tools} and replies may need review', {
    name: agent.displayName,
    tools: toolNames.join(', '),
  });
};

const pieceDisplayName = (pieceName: string): string =>
  pieceName.replace('@activepieces/piece-', '');

const AgentEditorSkeleton = () => (
  <div className="flex h-full w-full flex-col">
    <div className="flex h-[76px] shrink-0 items-center gap-[14px] border-b border-border px-6">
      <Skeleton className="size-12 rounded-[14px]" />
      <Skeleton className="h-5 w-[220px]" />
    </div>
    <div className="flex grow items-center justify-center p-6">
      <Skeleton className="h-[360px] w-full max-w-[720px] rounded-[19px]" />
    </div>
  </div>
);

const ConfigurePanel = ({
  agentId,
  defaults,
  onOpenChange,
}: {
  agentId: string;
  defaults: ConfigureAgentInput;
  onOpenChange: (open: boolean) => void;
}) => {
  const form = useForm<ConfigureAgentInput, unknown, ConfigureAgentValues>({
    resolver: zodResolver(ConfigureAgentSchema),
    defaultValues: defaults,
    mode: 'onChange',
  });
  const updateAgent = agentsMutations.useUpdateAgent({ id: agentId });

  const handleSubmit = (values: ConfigureAgentValues) => {
    form.clearErrors('root.serverError');
    updateAgent.mutate(toUpdateRequest(values), {
      onSuccess: () => onOpenChange(false),
      onError: () =>
        form.setError('root.serverError', {
          type: 'manual',
          message: t("Your changes weren't saved. Try again."),
        }),
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex min-h-0 grow flex-col"
      >
        <ScrollArea className="min-h-0 grow">
          <div className="flex flex-col gap-5 p-[18px]">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-[9px]">
                  <FormLabel showRequiredIndicator>{t('Name')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-[9px]">
                  <FormLabel>{t('Description')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="draft.instructions"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-[9px]">
                  <FormLabel showRequiredIndicator>
                    {t('Instructions')}
                  </FormLabel>
                  <FormControl>
                    <Textarea {...field} minRows={4} maxRows={12} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="draft.tools"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-[9px]">
                  <AgentTools
                    toolsField={field}
                    selectedProvider={form.watch('draft.provider') ?? undefined}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem className="flex flex-col gap-[9px]">
              <AIModelSelector
                defaultProvider={form.watch('draft.provider') ?? undefined}
                defaultModel={form.watch('draft.modelName') ?? undefined}
                onChange={({ provider, model }) => {
                  form.setValue('draft.provider', parseProvider(provider), {
                    shouldDirty: true,
                  });
                  form.setValue('draft.modelName', model ?? null, {
                    shouldDirty: true,
                  });
                }}
              />
            </FormItem>
            <FormField
              control={form.control}
              name="draft.structuredOutput"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-[9px]">
                  <AgentStructuredOutput
                    disabled={false}
                    structuredOutputField={field}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="draft.maxSteps"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-[9px]">
                  <FormLabel>{t('Max steps')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={MAX_AGENT_STEP_BUDGET}
                      value={field.value}
                      onChange={(event) =>
                        field.onChange(
                          Number(event.target.value) || DEFAULT_AGENT_MAX_STEPS,
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.formState.errors.root?.serverError && (
              <p className="text-sm text-destructive">
                {form.formState.errors.root.serverError.message}
              </p>
            )}
          </div>
        </ScrollArea>
        <div className="flex shrink-0 items-center justify-end gap-[10px] border-t border-border px-[18px] py-[14px]">
          <Button
            type="button"
            variant="outline"
            className="h-[38px] rounded-lg px-[18px]"
            onClick={() => onOpenChange(false)}
          >
            {t('Cancel')}
          </Button>
          <Button
            type="submit"
            loading={updateAgent.isPending}
            className="h-[38px] rounded-lg px-[18px]"
          >
            {t('Save changes')}
          </Button>
        </div>
      </form>
    </Form>
  );
};

const AgentEditorContent = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const { platform } = platformHooks.useCurrentPlatform();
  const [configuring, setConfiguring] = useState(false);
  const { data: agent, isLoading } = agentsQueries.useAgent({
    id: agentId ?? '',
    enabled: agentId !== undefined && platform.plan.agentsEnabled,
  });

  if (isLoading || agent === undefined) {
    return <AgentEditorSkeleton />;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-[76px] shrink-0 items-center gap-[14px] border-b border-border px-6">
        <AgentMark icon={agent.icon} color={agent.color} />
        <div className="flex min-w-0 grow basis-0 flex-col gap-[2px]">
          <span className="truncate text-[17px] leading-[22px] font-semibold tracking-[-0.01em]">
            {agent.displayName}
          </span>
          <span className="truncate text-[13px] leading-4 text-muted-foreground">
            {agent.description ?? t('No description yet')}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {agent.draft.modelName && (
            <span className="flex h-[34px] items-center gap-[7px] rounded-lg border border-border bg-background px-[11px] text-[13px] leading-4">
              <span
                className="size-[11px] shrink-0 rounded-[3px]"
                style={{
                  backgroundColor: PROJECT_COLOR_PALETTE[agent.color].color,
                }}
              />
              {agent.draft.modelName}
            </span>
          )}
          <button
            type="button"
            onClick={() => setConfiguring(true)}
            className="flex h-[34px] items-center gap-[7px] rounded-lg border border-border bg-background px-[13px] text-[13px] leading-4 font-semibold transition-colors hover:bg-accent"
          >
            <Settings2 size={15} />
            {t('Configure')}
          </button>
        </div>
      </div>

      <div className="flex min-h-0 grow flex-col">
        <AIChatBox
          incognito={false}
          agentId={agent.id}
          placeholder={t('Ask {name}...', { name: agent.displayName })}
          footerNote={buildCapabilityNote(agent)}
          emptyState={
            <AgentChatWelcome
              displayName={agent.displayName}
              description={agent.description ?? null}
              icon={agent.icon}
              color={agent.color}
            />
          }
        />
      </div>

      <Sheet open={configuring} onOpenChange={setConfiguring}>
        <SheetContent
          hideCloseButton
          className="flex w-[452px] max-w-none flex-col gap-0 p-0 sm:max-w-none"
        >
          <div className="flex shrink-0 flex-col border-b border-border">
            <div className="flex items-center gap-[14px] px-[18px] py-3">
              <AgentMark icon={agent.icon} color={agent.color} size="sm" />
              <div className="flex min-w-0 grow basis-0 flex-col">
                <span className="truncate text-sm font-semibold">
                  {agent.displayName}
                </span>
                <span className="text-[13px] leading-4 text-muted-foreground">
                  {t('Agent configuration')}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t('Close')}
                onClick={() => setConfiguring(false)}
              >
                <X size={16} />
              </Button>
            </div>
            <Tabs value="configure" className="px-[18px]">
              <TabsList variant="outline" className="gap-[22px]">
                <TabsTrigger value="configure" variant="outline">
                  {t('Configure')}
                </TabsTrigger>
                <TabsTrigger
                  value="runs"
                  variant="outline"
                  disabled
                  className="gap-2"
                >
                  {t('Runs')}
                  <Badge variant="secondary">{t('Soon')}</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <ConfigurePanel
            key={configuring ? 'open' : 'closed'}
            agentId={agent.id}
            defaults={{
              displayName: agent.displayName,
              description: agent.description ?? '',
              draft: agent.draft,
            }}
            onOpenChange={setConfiguring}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
};

const AgentEditorPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  return (
    <LockedFeatureGuard
      locked={!platform.plan.agentsEnabled}
      lockTitle={t('Unlock Agents')}
      lockDescription={t('Build an agent once, then use it in any flow.')}
      featureKey="AGENTS"
    >
      <AgentEditorContent />
    </LockedFeatureGuard>
  );
};

export { AgentEditorPage };
