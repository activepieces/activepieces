import { unique } from '@activepieces/core-utils';
import {
  Agent,
  AgentConfig,
  AgentIcon,
  AgentToolType,
  ColorName,
  DEFAULT_AGENT_MAX_STEPS,
  MAX_AGENT_STEP_BUDGET,
  PROJECT_COLOR_PALETTE,
  UpdateAgentRequest,
  formErrors,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { t } from 'i18next';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

import { AgentTools } from '@/app/builder/step-settings/agent-settings/agent-tools';
import { LockedFeatureGuard } from '@/app/components/locked-feature-guard';
import { AIChatBox } from '@/app/routes/chat-with-ai/ai-chat-box';
import { ConversationList } from '@/app/routes/chat-with-ai/conversation-list';
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
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const ConfigureAgentSchema = z.object({
  displayName: z.string().min(1, formErrors.required),
  description: z.string(),
  icon: z.enum(AgentIcon),
  color: z.enum(ColorName),
  draft: AgentConfig,
});

type ConfigureAgentInput = z.input<typeof ConfigureAgentSchema>;
type ConfigureAgentValues = z.output<typeof ConfigureAgentSchema>;

const toUpdateRequest = (values: ConfigureAgentValues): UpdateAgentRequest => ({
  displayName: values.displayName,
  description: values.description.length > 0 ? values.description : null,
  icon: values.icon,
  color: values.color,
  draft: values.draft,
});

const parseProvider = (provider?: string) => {
  const parsed = AgentConfig.shape.provider.safeParse(provider ?? null);
  return parsed.success ? parsed.data : null;
};

const pieceDisplayName = (pieceName: string): string =>
  pieceName.replace('@activepieces/piece-', '');

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

const CONVERSATION_QUERY_PARAM = 'conversation';
const PANEL_TRANSITION = { duration: 0.22, ease: [0.35, 0, 0.25, 1] } as const;

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

const SettingsFields = ({
  form,
}: {
  form: ReturnType<
    typeof useForm<ConfigureAgentInput, unknown, ConfigureAgentValues>
  >;
}) => (
  <>
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
            <Textarea {...field} minRows={2} maxRows={4} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={form.control}
      name="icon"
      render={({ field }) => (
        <FormItem className="flex flex-col gap-[9px]">
          <FormLabel>{t('Shape')}</FormLabel>
          <div className="grid grid-cols-6 gap-2">
            {Object.values(AgentIcon).map((iconName) => (
              <button
                key={iconName}
                type="button"
                aria-label={iconName}
                onClick={() => field.onChange(iconName)}
                className={cn(
                  'flex items-center justify-center rounded-[10px] p-[3px]',
                  field.value === iconName && 'ring-2 ring-foreground',
                )}
              >
                <AgentMark
                  icon={iconName}
                  color={form.watch('color')}
                  size="sm"
                />
              </button>
            ))}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={form.control}
      name="color"
      render={({ field }) => (
        <FormItem className="flex flex-col gap-[9px]">
          <FormLabel>{t('Color')}</FormLabel>
          <div className="grid grid-cols-6 gap-2">
            {Object.values(ColorName).map((colorName) => (
              <button
                key={colorName}
                type="button"
                aria-label={colorName}
                onClick={() => field.onChange(colorName)}
                className={cn(
                  'flex items-center justify-center rounded-full p-[3px]',
                  field.value === colorName && 'ring-2 ring-foreground',
                )}
              >
                <span
                  className="size-6 rounded-full"
                  style={{
                    backgroundColor: PROJECT_COLOR_PALETTE[colorName].color,
                  }}
                />
              </button>
            ))}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  </>
);

const ConfigureFields = ({
  form,
}: {
  form: ReturnType<
    typeof useForm<ConfigureAgentInput, unknown, ConfigureAgentValues>
  >;
}) => (
  <>
    <FormField
      control={form.control}
      name="draft.instructions"
      render={({ field }) => (
        <FormItem className="flex flex-col gap-[9px]">
          <FormLabel showRequiredIndicator>{t('Instructions')}</FormLabel>
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
  </>
);

const ConfigurePanel = ({
  agentId,
  icon,
  color,
  displayName,
  defaults,
  onCollapse,
}: {
  agentId: string;
  icon: AgentIcon;
  color: ColorName;
  displayName: string;
  defaults: ConfigureAgentInput;
  onCollapse: () => void;
}) => {
  const [tab, setTab] = useState('configure');
  const form = useForm<ConfigureAgentInput, unknown, ConfigureAgentValues>({
    resolver: zodResolver(ConfigureAgentSchema),
    defaultValues: defaults,
    mode: 'onChange',
  });
  const updateAgent = agentsMutations.useUpdateAgent({ id: agentId });

  const handleSubmit = (values: ConfigureAgentValues) => {
    form.clearErrors('root.serverError');
    updateAgent.mutate(toUpdateRequest(values), {
      onSuccess: () => {
        form.reset(values);
        toast(t('Agent saved'));
      },
      onError: (error) =>
        form.setError('root.serverError', {
          type: 'manual',
          message: api.extractServerErrorMessage(
            error,
            t("Your changes weren't saved. Try again."),
          ),
        }),
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex h-full min-h-0 flex-col"
      >
        <div className="flex shrink-0 flex-col border-b border-border">
          <div className="flex items-center gap-[14px] px-[18px] py-3">
            <AgentMark icon={icon} color={color} size="sm" />
            <div className="flex min-w-0 grow basis-0 flex-col">
              <span className="truncate text-sm font-semibold">
                {displayName}
              </span>
              <span className="text-[13px] leading-4 text-muted-foreground">
                {t('Agent configuration')}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t('Collapse configuration')}
              onClick={onCollapse}
            >
              <ChevronsRight size={16} />
            </Button>
          </div>
          <Tabs value={tab} onValueChange={setTab} className="px-[18px]">
            <TabsList variant="outline" className="gap-[22px]">
              <TabsTrigger value="configure" variant="outline">
                {t('Configure')}
              </TabsTrigger>
              <TabsTrigger value="settings" variant="outline">
                {t('Settings')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className="min-h-0 grow">
          <div className="flex flex-col gap-5 p-[18px]">
            {tab === 'configure' ? (
              <ConfigureFields form={form} />
            ) : (
              <SettingsFields form={form} />
            )}
            {form.formState.errors.root?.serverError && (
              <p className="text-sm text-destructive">
                {form.formState.errors.root.serverError.message}
              </p>
            )}
          </div>
        </ScrollArea>

        <div className="flex shrink-0 items-center justify-end gap-[10px] border-t border-border px-[18px] py-[14px]">
          <Button
            type="submit"
            loading={updateAgent.isPending}
            disabled={!form.formState.isDirty}
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
  const [configureOpen, setConfigureOpen] = useState(false);
  const [conversationsOpen, setConversationsOpen] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const conversationId =
    searchParams.get(CONVERSATION_QUERY_PARAM) ?? undefined;

  const openConversation = (nextConversationId: string) => {
    const next = new URLSearchParams(searchParams);
    next.set(CONVERSATION_QUERY_PARAM, nextConversationId);
    setSearchParams(next, { replace: true });
  };
  const startNewConversation = () => {
    const next = new URLSearchParams(searchParams);
    next.delete(CONVERSATION_QUERY_PARAM);
    setSearchParams(next, { replace: true });
  };
  const { data: agent, isLoading } = agentsQueries.useAgent({
    id: agentId ?? '',
    enabled: agentId !== undefined && platform.plan.agentsEnabled,
  });

  if (isLoading || agent === undefined) {
    return <AgentEditorSkeleton />;
  }

  return (
    <div className="flex h-full w-full">
      <AnimatePresence initial={false}>
        {conversationsOpen && (
          <motion.aside
            key="conversations"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={PANEL_TRANSITION}
            className="shrink-0 overflow-hidden border-r border-border"
          >
            <div className="flex h-full w-[260px] flex-col">
              <ConversationList
                agentId={agent.id}
                hideSettings
                selectedId={conversationId ?? null}
                onSelect={openConversation}
                onNewChat={startNewConversation}
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
      <div className="flex min-w-0 grow flex-col">
        <div className="flex h-[76px] shrink-0 items-center gap-[14px] border-b border-border px-6">
          {!conversationsOpen && (
            <button
              type="button"
              aria-label={t('Expand conversations')}
              onClick={() => setConversationsOpen(true)}
              className="flex size-[34px] shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ChevronsRight size={16} />
            </button>
          )}
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
            {!configureOpen && (
              <button
                type="button"
                aria-label={t('Expand configuration')}
                onClick={() => setConfigureOpen(true)}
                className="flex size-[34px] items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <ChevronsLeft size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="flex min-h-0 grow flex-col">
          <AIChatBox
            key={conversationId ?? 'new'}
            incognito={false}
            agentId={agent.id}
            conversationId={conversationId ?? null}
            onConversationCreated={openConversation}
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
      </div>

      <AnimatePresence initial={false}>
        {configureOpen && (
          <motion.aside
            key="configure"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 452, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={PANEL_TRANSITION}
            className="shrink-0 overflow-hidden border-l border-border"
          >
            <div className="flex h-full w-[452px] flex-col">
              <ConfigurePanel
                key={agent.updated}
                agentId={agent.id}
                icon={agent.icon}
                color={agent.color}
                displayName={agent.displayName}
                defaults={{
                  displayName: agent.displayName,
                  description: agent.description ?? '',
                  icon: agent.icon,
                  color: agent.color,
                  draft: agent.draft,
                }}
                onCollapse={() => setConfigureOpen(false)}
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
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
