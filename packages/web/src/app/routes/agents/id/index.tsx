import { isNil, unique } from '@activepieces/core-utils';
import {
  Agent,
  AgentConfig,
  AgentIcon,
  agentUtils,
  AgentToolType,
  ColorName,
  DEFAULT_AGENT_MAX_STEPS,
  MAX_AGENT_STEP_BUDGET,
  PROJECT_COLOR_PALETTE,
  UpdateAgentRequest,
  formErrors,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import {
  Check,
  ChevronsLeft,
  ChevronsRight,
  Circle,
  Settings2,
} from 'lucide-react';
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

type AgentRequirement = {
  label: string;
  hint: string;
  met: boolean;
};

// A run reads the published configuration and only falls back to the draft, so readiness has to
// be judged on the same one. Otherwise clearing a published agent's draft would present a
// perfectly runnable agent as unfinished.
const requirementsFor = (agent: Agent): AgentRequirement[] => {
  const running = agent.published ?? agent.draft;
  return [
    {
      label: t('Instructions'),
      hint: t('What the agent should do, and how to decide.'),
      met: agentUtils.isPublishable(running),
    },
    {
      label: t('Model'),
      hint: t('The model that answers, and the provider behind it.'),
      met: !isNil(running.modelName) && !isNil(running.provider),
    },
  ];
};

const AgentNotReady = ({
  requirements,
  onConfigure,
}: {
  requirements: AgentRequirement[];
  onConfigure: () => void;
}) => (
  <div className="flex h-full flex-col items-center justify-center gap-5 px-6">
    <div className="flex flex-col items-center gap-2 text-center">
      <p className="text-xl leading-7 font-semibold tracking-[-0.02em]">
        {t('Almost ready')}
      </p>
      <p className="max-w-[420px] text-sm leading-[150%] text-muted-foreground">
        {t('Fill these in and you can start talking to this agent.')}
      </p>
    </div>

    <ul className="flex w-full max-w-[420px] flex-col gap-2">
      {requirements.map((requirement) => (
        <li
          key={requirement.label}
          className="flex items-start gap-3 rounded-[10px] border border-border p-3"
        >
          {requirement.met ? (
            <Check size={16} className="mt-[3px] shrink-0 text-success-700" />
          ) : (
            <Circle size={16} className="mt-[3px] shrink-0 text-neutral-400" />
          )}
          <span className="flex min-w-0 flex-col gap-[2px]">
            <span
              className={cn(
                'text-sm font-semibold',
                requirement.met && 'text-muted-foreground line-through',
              )}
            >
              {requirement.label}
            </span>
            <span className="text-[13px] leading-4 text-muted-foreground">
              {requirement.hint}
            </span>
          </span>
        </li>
      ))}
    </ul>

    <Button className="gap-2" onClick={onConfigure}>
      <Settings2 size={16} />
      {t('Finish setting up')}
    </Button>
  </div>
);

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
  needsModel,
}: {
  form: ReturnType<
    typeof useForm<ConfigureAgentInput, unknown, ConfigureAgentValues>
  >;
  needsModel: boolean;
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
      {needsModel && (
        <p className="text-[13px] leading-4 text-destructive">
          {t('Pick a model so this agent can answer.')}
        </p>
      )}
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

  const values = form.watch();
  const formNeedsModel =
    isNil(values.draft?.modelName) || isNil(values.draft?.provider);
  // The model selector fills itself in on mount, which react-hook-form counts as the user editing.
  const hasChanges = JSON.stringify(values) !== JSON.stringify(defaults);

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
              <TabsTrigger
                value="configure"
                variant="outline"
                className="gap-2"
              >
                {t('Configure')}
                {formNeedsModel && (
                  <span className="size-[7px] rounded-full bg-destructive" />
                )}
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
              <ConfigureFields form={form} needsModel={formNeedsModel} />
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
            disabled={!hasChanges}
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
  const [configureOpen, setConfigureOpen] = useState<boolean>();
  const [conversationsOpen, setConversationsOpen] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const conversationId =
    searchParams.get(CONVERSATION_QUERY_PARAM) ?? undefined;
  const [openedConversationId, setOpenedConversationId] =
    useState(conversationId);
  const [freshConversations, setFreshConversations] = useState(0);

  const writeConversationParam = (nextConversationId: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (nextConversationId === null) {
      next.delete(CONVERSATION_QUERY_PARAM);
    } else {
      next.set(CONVERSATION_QUERY_PARAM, nextConversationId);
    }
    setSearchParams(next, { replace: true });
  };
  const openConversation = (nextConversationId: string) => {
    setOpenedConversationId(nextConversationId);
    writeConversationParam(nextConversationId);
  };
  const startNewConversation = () => {
    setOpenedConversationId(undefined);
    setFreshConversations((count) => count + 1);
    writeConversationParam(null);
  };
  const { data: agent, isLoading } = agentsQueries.useAgent({
    id: agentId ?? '',
    enabled: agentId !== undefined && platform.plan.agentsEnabled,
  });

  if (isLoading || agent === undefined) {
    return <AgentEditorSkeleton />;
  }

  const requirements = requirementsFor(agent);
  const needsModel = requirements.some((requirement) => !requirement.met);
  const isConfigureOpen = configureOpen ?? needsModel;

  return (
    <div className="flex h-full w-full">
      <aside
        className={cn(
          'shrink-0 overflow-hidden border-r border-border transition-[width] duration-200 ease-out',
          conversationsOpen ? 'w-[220px]' : 'w-0',
        )}
      >
        <div className="flex h-full w-[220px] flex-col">
          <ConversationList
            agentId={agent.id}
            selectedId={openedConversationId ?? conversationId ?? null}
            onSelect={openConversation}
            onNewChat={startNewConversation}
          />
        </div>
      </aside>
      <div className="flex min-w-0 grow flex-col">
        <div className="flex h-[76px] shrink-0 items-center gap-[14px] border-b border-border px-6">
          <button
            type="button"
            aria-label={
              conversationsOpen
                ? t('Collapse conversations')
                : t('Expand conversations')
            }
            onClick={() => setConversationsOpen(!conversationsOpen)}
            className="flex size-[34px] shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {conversationsOpen ? (
              <ChevronsLeft size={16} />
            ) : (
              <ChevronsRight size={16} />
            )}
          </button>
          <AgentMark icon={agent.icon} color={agent.color} />
          <div className="flex min-w-0 grow basis-0 flex-col gap-[2px]">
            <span className="truncate text-[17px] leading-[22px] font-semibold tracking-[-0.01em]">
              {agent.displayName}
            </span>
            <span className="truncate text-[13px] leading-4 text-muted-foreground">
              {agent.description ?? t('No description yet')}
            </span>
          </div>
          <div className="flex min-w-0 shrink items-center gap-2">
            {agent.draft.modelName && !isConfigureOpen && (
              <span className="flex h-[34px] max-w-[220px] items-center gap-[7px] overflow-hidden rounded-lg border border-border bg-background px-[11px] text-[13px] leading-4">
                <span
                  className="size-[11px] shrink-0 rounded-[3px]"
                  style={{
                    backgroundColor: PROJECT_COLOR_PALETTE[agent.color].color,
                  }}
                />
                <span className="truncate">{agent.draft.modelName}</span>
              </span>
            )}
            {!isConfigureOpen && (
              <button
                type="button"
                aria-label={t('Expand configuration')}
                onClick={() => setConfigureOpen(true)}
                className="relative flex size-[34px] items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <ChevronsLeft size={16} />
                {needsModel && (
                  <span className="absolute top-[6px] right-[6px] size-[7px] rounded-full bg-destructive" />
                )}
              </button>
            )}
          </div>
        </div>

        <div className="flex min-h-0 grow flex-col">
          {needsModel ? (
            <AgentNotReady
              requirements={requirements}
              onConfigure={() => setConfigureOpen(true)}
            />
          ) : (
            <AIChatBox
              key={openedConversationId ?? `new-${freshConversations}`}
              incognito={false}
              agentId={agent.id}
              conversationId={openedConversationId ?? null}
              onConversationCreated={writeConversationParam}
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
          )}
        </div>
      </div>

      <aside
        className={cn(
          'shrink-0 overflow-hidden border-l border-border transition-[width] duration-200 ease-out',
          isConfigureOpen ? 'w-[452px]' : 'w-0',
        )}
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
      </aside>
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
