import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

const SCENE_COUNT = 5;
const SCENE_DURATION_MS = 4000;
const TICK_INTERVAL_MS = 100;
const TICKS_PER_SCENE = SCENE_DURATION_MS / TICK_INTERVAL_MS;
const TYPING_INTERVAL_MS = 20;
const MORPHING_DURATION_MS = 800;
const _CANVAS_HEIGHT = 520;

const CDN = 'https://cdn.activepieces.com/pieces';

const FULL_PROMPT =
  'When a new lead arrives, research their company and role. Score them 1-10 based on fit. If score > 7, ask me on Slack before sending a discount.';

const BASE_TOOLS = ['hubspot', 'slack', 'openai'];

const INTEGRATION_LOGOS = [
  { name: 'Salesforce', slug: 'salesforce' },
  { name: 'ServiceNow', slug: 'service-now' },
  { name: 'SAP Ariba', slug: 'sap-ariba' },
  { name: 'NetSuite', slug: 'netsuite' },
  { name: 'Microsoft Teams', slug: 'microsoft-teams' },
  { name: 'Slack', slug: 'slack' },
  { name: 'HubSpot', slug: 'hubspot' },
  { name: 'Zendesk', slug: 'zendesk' },
  { name: 'Jira Cloud', slug: 'jira' },
  { name: 'Snowflake', slug: 'snowflake' },
  { name: 'Dynamics CRM', slug: 'microsoft-dynamics-crm' },
  { name: 'Intercom', slug: 'intercom' },
] as const;

type SceneIndex = 0 | 1 | 2 | 3 | 4;

type AgentPosition = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type LeadRow = {
  name: string;
  company: string;
  score: number;
  status: string;
  scoreColor: string;
  statusBg: string;
  statusText: string;
  dotColor: string;
};

const LEADS: LeadRow[] = [
  {
    name: 'Sarah Chen',
    company: 'Stripe',
    score: 92,
    status: 'Qualified',
    scoreColor: 'bg-emerald-100 text-emerald-700',
    statusBg: 'bg-emerald-100',
    statusText: 'text-emerald-700',
    dotColor: 'bg-emerald-500',
  },
  {
    name: 'Mike Johnson',
    company: 'Shopify',
    score: 68,
    status: 'Nurturing',
    scoreColor: 'bg-amber-100 text-amber-700',
    statusBg: 'bg-amber-100',
    statusText: 'text-amber-700',
    dotColor: 'bg-amber-500',
  },
  {
    name: 'Lisa Park',
    company: 'Figma',
    score: 34,
    status: 'New',
    scoreColor: 'bg-gray-100 text-gray-600',
    statusBg: 'bg-gray-100',
    statusText: 'text-gray-500',
    dotColor: 'bg-gray-400',
  },
  {
    name: 'Alex Rivera',
    company: 'Notion',
    score: 85,
    status: 'Qualified',
    scoreColor: 'bg-emerald-100 text-emerald-700',
    statusBg: 'bg-emerald-100',
    statusText: 'text-emerald-700',
    dotColor: 'bg-emerald-500',
  },
  {
    name: 'Jordan Lee',
    company: 'Vercel',
    score: 52,
    status: 'Nurturing',
    scoreColor: 'bg-amber-100 text-amber-700',
    statusBg: 'bg-amber-100',
    statusText: 'text-amber-700',
    dotColor: 'bg-amber-500',
  },
  {
    name: 'Emma Wilson',
    company: 'Linear',
    score: 78,
    status: 'Qualified',
    scoreColor: 'bg-emerald-100 text-emerald-700',
    statusBg: 'bg-emerald-100',
    statusText: 'text-emerald-700',
    dotColor: 'bg-emerald-500',
  },
];

// ── SVG Icons ──

function PauseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width="1em"
      height="1em"
      fill="currentColor"
      className="w-3.5 h-3.5 text-gray-700"
    >
      <path d="M216,48V208a16,16,0,0,1-16,16H160a16,16,0,0,1-16-16V48a16,16,0,0,1,16-16h40A16,16,0,0,1,216,48ZM96,32H56A16,16,0,0,0,40,48V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V48A16,16,0,0,0,96,32Z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width="1em"
      height="1em"
      fill="currentColor"
      className="w-3.5 h-3.5 text-gray-700"
    >
      <path d="M232.4,114.49,88.32,26.35a16,16,0,0,0-16.2-.3A15.86,15.86,0,0,0,64,40.74V215.26a15.94,15.94,0,0,0,8.12,13.89,16,16,0,0,0,16.2-.3L232.4,141.51a16,16,0,0,0,0-27Z" />
    </svg>
  );
}

function SlackSvgIcon() {
  return (
    <svg
      className="w-4 h-4 text-white/90"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  );
}

function ConditionSvg() {
  return (
    <svg
      className="w-[19px] h-[19px] text-amber-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function LoopSvg() {
  return (
    <svg
      className="w-[19px] h-[19px] text-pink-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

function TableSvg() {
  return (
    <svg
      className="w-4 h-4 text-violet-600"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M3 10h18M3 14h18M10 3v18M14 3v18"
      />
    </svg>
  );
}

// ── Flow Node (reusable card for flow builder) ──

function FlowNode({
  icon,
  label,
  subtitle,
  borderColor = 'border-gray-200',
  iconBg = 'bg-gray-50',
}: {
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  borderColor?: string;
  iconBg?: string;
}) {
  return (
    <div className={cn('rounded-xl border bg-white px-3 py-2.5', borderColor)}>
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
            iconBg,
          )}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 text-sm truncate leading-tight">
            {label}
          </div>
          <div className="text-gray-500 text-xs truncate leading-tight">
            {subtitle}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Agent Card (the single element that morphs between scenes) ──

function AgentCard({
  activeIndex,
  position,
  isMorphing,
  typedPrompt,
  isTyping,
}: {
  activeIndex: SceneIndex;
  position: AgentPosition;
  isMorphing: boolean;
  typedPrompt: string;
  isTyping: boolean;
}) {
  const isLarge = activeIndex === 0 || activeIndex === 1;
  const isCollapsed = activeIndex === 3;
  const showInstructions = activeIndex === 0;
  const showToolsHighlight = activeIndex === 1;

  const title = isLarge
    ? 'Lead Qualifier'
    : activeIndex === 2
    ? '2. Qualify Lead'
    : 'Qualify Lead';

  return (
    <div
      className={cn(
        'auth-anim-agent absolute',
        activeIndex === 1 ? 'z-20' : 'z-30',
      )}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
        height: `${position.height}px`,
      }}
    >
      {/* Animated gradient border wrapper */}
      <div
        className={cn(
          'auth-anim-gradient-border rounded-xl h-full p-[2px] relative',
          isMorphing && 'auth-anim-gradient-morphing',
        )}
      >
        {/* Full agent card (scenes 0, 1, 2, 4) */}
        <div
          className="bg-white rounded-[10px] overflow-hidden h-full"
          style={{
            transition: 'opacity 300ms ease, visibility 300ms ease',
            transitionDelay: isCollapsed ? '0ms' : '200ms',
            opacity: isCollapsed ? 0 : 1,
            visibility: isCollapsed ? 'hidden' : 'visible',
          }}
        >
          {/* Header */}
          <div className="px-3 py-2.5 flex items-center gap-2.5">
            <div
              className={cn(
                'flex-shrink-0 rounded-lg flex items-center justify-center bg-gradient-to-br from-violet-100 to-fuchsia-100 transition-all duration-500',
                isLarge ? 'w-10 h-10' : 'w-8 h-8',
              )}
            >
              <span
                className={cn(
                  'transition-all duration-300',
                  isLarge ? 'text-sm' : 'text-xs',
                )}
              >
                {'🤖'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate leading-tight text-sm">
                {title}
              </div>
              <div className="text-gray-500 truncate leading-tight text-xs">
                AI Agent
              </div>
            </div>
          </div>

          {/* Body (expanded view - scenes 0 and 1) */}
          <div
            className="transition-all duration-500 ease-out overflow-hidden border-t border-gray-100"
            style={{
              maxHeight:
                activeIndex === 0 || activeIndex === 1 ? '400px' : '0px',
              opacity: activeIndex === 0 || activeIndex === 1 ? 1 : 0,
            }}
          >
            <div className="p-4 space-y-3">
              {/* Instructions */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">
                  Instructions
                </label>
                {showInstructions ? (
                  <div className="p-3 rounded-lg bg-violet-50 border border-violet-200 min-h-[60px]">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {typedPrompt}
                      {isTyping && (
                        <span className="inline-block w-0.5 h-4 bg-violet-500 ml-0.5 animate-pulse" />
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-gray-100 border border-gray-200 min-h-[60px] space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-4/5" />
                    <div className="h-3 bg-gray-200 rounded w-3/5" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {/* Trigger */}
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">
                    Trigger
                  </p>
                  {showInstructions ? (
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                        <img
                          src={`${CDN}/hubspot.png`}
                          className="w-4 h-4"
                          alt=""
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        New Lead
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-gray-200 flex-shrink-0" />
                      <div className="h-3 bg-gray-200 rounded w-16" />
                    </div>
                  )}
                </div>
                {/* Tools */}
                <div
                  className={cn(
                    'p-3 rounded-lg',
                    showToolsHighlight
                      ? 'bg-violet-50 border border-violet-200'
                      : 'bg-gray-50 border border-gray-100',
                  )}
                >
                  <p
                    className={cn(
                      'text-xs font-bold uppercase mb-2',
                      showToolsHighlight ? 'text-violet-500' : 'text-gray-400',
                    )}
                  >
                    Tools
                  </p>
                  {showInstructions ? (
                    <div className="flex items-center gap-1">
                      {BASE_TOOLS.map((piece) => (
                        <div
                          key={piece}
                          className="w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center flex-shrink-0"
                        >
                          <img
                            src={`${CDN}/${piece}.png`}
                            className="w-4 h-4"
                            alt=""
                          />
                        </div>
                      ))}
                      <div className="w-7 h-7 rounded-md bg-violet-100 border border-violet-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-violet-600">
                          +
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <div className="w-7 h-7 rounded-md bg-gray-200 flex-shrink-0" />
                      <div className="w-7 h-7 rounded-md bg-gray-200 flex-shrink-0" />
                      <div
                        className={cn(
                          'w-7 h-7 rounded-md bg-violet-200 border-2 border-violet-400 flex items-center justify-center flex-shrink-0',
                          showToolsHighlight && 'animate-pulse',
                        )}
                      >
                        <span className="text-xs font-bold text-violet-600">
                          +
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Collapsed emoji overlay (scene 3) */}
        <div
          className="absolute inset-[2px] rounded-[10px] bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center text-sm"
          style={{
            transition: 'opacity 300ms ease, visibility 300ms ease',
            transitionDelay: isCollapsed ? '200ms' : '0ms',
            opacity: isCollapsed ? 1 : 0,
            visibility: isCollapsed ? 'visible' : 'hidden',
          }}
        >
          {'🤖'}
        </div>
      </div>
    </div>
  );
}

// ── Scene 0: Natural Language (just a slot for the agent) ──

function Scene0Slot({
  slotRef,
}: {
  slotRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-8">
      <div ref={slotRef} className="w-[340px] h-[320px]" />
    </div>
  );
}

// ── Scene 1: Integrations Popup ──

function Scene1({
  visible,
  slotRef,
}: {
  visible: boolean;
  slotRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center p-6 z-40"
      style={{
        transition: 'opacity 500ms cubic-bezier(0.16,1,0.3,1)',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div className="flex items-start">
        {/* Agent slot */}
        <div ref={slotRef} className="w-[340px] h-[320px] relative mt-12" />

        {/* Overlapping popup */}
        <div className="w-64 -ml-16 relative z-50">
          {/* Header */}
          <div className="px-4 py-3 border border-gray-200 border-b-0 rounded-t-xl bg-white">
            <p className="font-semibold text-gray-900 text-sm">Add Tools</p>
          </div>

          {/* Tools grid */}
          <div className="p-3 border-x border-gray-200 bg-white relative">
            <div className="grid grid-cols-4 gap-2">
              {INTEGRATION_LOGOS.map((app) => (
                <div
                  key={app.slug}
                  className="group/icon relative w-12 h-12 rounded-lg bg-white border border-gray-200 p-2 hover:border-violet-400 hover:scale-105 hover:bg-violet-50 transition-all duration-150 cursor-pointer flex items-center justify-center hover:z-[100]"
                >
                  <img
                    src={`${CDN}/${app.slug}.png`}
                    alt={app.name}
                    className="w-7 h-7 object-contain pointer-events-none"
                  />
                  <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover/icon:opacity-100 group-hover/icon:visible transition-all duration-150 z-[200]">
                    {app.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border border-gray-200 border-t-gray-100 rounded-b-xl flex items-center justify-between">
            <p className="text-gray-900 font-semibold">685+ apps</p>
            <span className="text-xs text-violet-600 font-medium">
              Browse all &rarr;
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Scene 2: Flow View (Custom Logic) ──

function Scene2({
  visible,
  slotRef,
}: {
  visible: boolean;
  slotRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        transition: 'opacity 500ms ease',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        paddingTop: '60px',
      }}
    >
      <div className="relative" style={{ width: '390px', height: '400px' }}>
        {/* SVG Connection Lines */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width="390"
          height="400"
        >
          {/* Main flow: Trigger -> Agent -> Condition */}
          <path
            d="M 195 52 L 195 87"
            stroke="#9ca3af"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 195 139 L 195 174"
            stroke="#9ca3af"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          {/* LEFT BRANCH ENTRY */}
          <path
            d="M 195 226 L 195 241 Q 195 253, 183 253 L 92 253 Q 80 253, 80 265"
            stroke="#9ca3af"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* RIGHT BRANCH ENTRY */}
          <path
            d="M 195 226 L 195 241 Q 195 253, 207 253 L 298 253 Q 310 253, 310 265"
            stroke="#9ca3af"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* LEFT BRANCH vertical */}
          <path
            d="M 80 317 L 80 347"
            stroke="#9ca3af"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          {/* RIGHT BRANCH vertical */}
          <path
            d="M 310 317 L 310 347"
            stroke="#9ca3af"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>

        {/* Node 1: Trigger (y=0) */}
        <div
          className="absolute"
          style={{ left: '115px', top: '0px', width: '160px' }}
        >
          <div className="absolute -top-5 left-0 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200 z-10">
            {'⚡'} Trigger
          </div>
          <FlowNode
            icon={
              <img
                src={`${CDN}/hubspot.png`}
                className="w-[19px] h-[19px]"
                alt=""
              />
            }
            label="1. New Lead"
            subtitle="HubSpot"
            iconBg="bg-pink-50"
          />
        </div>

        {/* Node 2: Agent slot (y=87) */}
        <div
          ref={slotRef}
          className="absolute"
          style={{
            left: '115px',
            top: '87px',
            width: '160px',
            height: '52px',
          }}
        />

        {/* Node 3: Condition (y=174) */}
        <div
          className="absolute"
          style={{ left: '115px', top: '174px', width: '160px' }}
        >
          <FlowNode
            icon={<ConditionSvg />}
            label="3. Qualified?"
            subtitle="Condition"
            borderColor="border-amber-200"
            iconBg="bg-amber-50"
          />
        </div>

        {/* LEFT BRANCH Node 1: Salesforce (y=265) */}
        <div
          className="absolute"
          style={{ left: '0px', top: '265px', width: '160px' }}
        >
          <FlowNode
            icon={
              <img
                src={`${CDN}/salesforce.png`}
                className="w-[19px] h-[19px]"
                alt=""
              />
            }
            label="4. Add to CRM"
            subtitle="Salesforce"
            iconBg="bg-blue-50"
          />
        </div>

        {/* LEFT BRANCH Node 2: Slack (y=347) */}
        <div
          className="absolute"
          style={{ left: '0px', top: '347px', width: '160px' }}
        >
          <FlowNode
            icon={
              <img
                src={`${CDN}/slack.png`}
                className="w-[19px] h-[19px]"
                alt=""
              />
            }
            label="5. Notify Sales"
            subtitle="Slack"
            iconBg="bg-purple-50"
          />
        </div>

        {/* RIGHT BRANCH Node 1: Loop (y=265) */}
        <div
          className="absolute"
          style={{ left: '230px', top: '265px', width: '160px' }}
        >
          <FlowNode
            icon={<LoopSvg />}
            label="6. Nurture Loop"
            subtitle="Loop"
            borderColor="border-pink-200"
            iconBg="bg-pink-50"
          />
        </div>

        {/* RIGHT BRANCH Node 2: Email (y=347) */}
        <div
          className="absolute"
          style={{ left: '230px', top: '347px', width: '160px' }}
        >
          <FlowNode
            icon={
              <img
                src={`${CDN}/gmail.png`}
                className="w-[19px] h-[19px]"
                alt=""
              />
            }
            label="7. Send Email"
            subtitle="Gmail"
            iconBg="bg-cyan-50"
          />
        </div>
      </div>
    </div>
  );
}

// ── Scene 3: Slack Message (Human Approval) ──

function Scene3({
  visible,
  slotRef,
}: {
  visible: boolean;
  slotRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center p-8"
      style={{
        transition: 'opacity 500ms ease',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
          {/* Slack header */}
          <div className="px-3 py-2 bg-[#4A154B] flex items-center gap-2">
            <SlackSvgIcon />
            <span className="text-white/90 text-sm">#sales</span>
          </div>

          {/* Message */}
          <div className="p-4">
            <div className="flex gap-3">
              {/* Slot for agent avatar */}
              <div ref={slotRef} className="w-8 h-8 flex-shrink-0 mt-0.5" />

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-bold text-gray-900 text-sm">
                    Lead Qualifier
                  </span>
                  <span className="text-gray-400 text-xs">11:42 AM</span>
                </div>

                <div className="space-y-2 text-sm text-gray-800 leading-relaxed">
                  <p>
                    Hey! <strong>Sarah Chen</strong> from TechCorp just signed
                    up.
                  </p>
                  <p className="text-gray-600">
                    She&apos;s VP of Engineering and matches our ICP. Should I
                    send the intro sequence?
                  </p>
                </div>

                {/* Slack-style buttons */}
                <div className="flex gap-2 mt-3">
                  <button className="px-4 py-1.5 bg-[#007a5a] hover:bg-[#148567] text-white text-sm font-medium rounded transition-colors">
                    Send intro
                  </button>
                  <button className="px-4 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded border border-gray-300 transition-colors">
                    Skip
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Scene 4: Tables (Agent Data) ──

function Scene4({
  visible,
  slotRef,
}: {
  visible: boolean;
  slotRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-end"
      style={{
        transition: 'opacity 500ms ease',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      {/* TOP: Agent card */}
      <div className="relative flex-shrink-0 mt-32">
        <div ref={slotRef} className="w-[200px] h-[60px]" />
      </div>

      {/* Vertical lines */}
      <div className="relative w-[30px] h-[60px] flex-shrink-0 z-0">
        <svg className="w-full h-full" preserveAspectRatio="none">
          <line
            x1="10"
            y1="0"
            x2="10"
            y2="100%"
            stroke="#10b981"
            strokeWidth="2"
            strokeOpacity="0.2"
            strokeLinecap="round"
          />
          <line
            x1="20"
            y1="100%"
            x2="20"
            y2="0"
            stroke="#8b5cf6"
            strokeWidth="2"
            strokeOpacity="0.2"
            strokeLinecap="round"
          />
        </svg>
        {/* Animated particles - centered on lines */}
        <div className="absolute inset-0 pointer-events-none">
          {[0, 0.5, 1, 1.5].map((delay) => (
            <span
              key={`down-${delay}`}
              className="auth-anim-particle-dot-vertical bg-emerald-500"
              style={{ left: '8px', animationDelay: `${delay}s` }}
            />
          ))}
          {[0, 0.5, 1, 1.5].map((delay) => (
            <span
              key={`up-${delay}`}
              className="auth-anim-particle-dot-vertical-reverse bg-violet-500"
              style={{ left: '18px', animationDelay: `${delay}s` }}
            />
          ))}
        </div>
      </div>

      {/* BOTTOM: Table - extends beyond container */}
      <div className="bg-white border border-gray-200 border-b-0 rounded-t-xl flex flex-col overflow-hidden w-[90%] z-10">
        {/* Toolbar */}
        <div className="px-4 py-2.5 bg-white border-b border-gray-200 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-violet-100 flex items-center justify-center">
              <TableSvg />
            </div>
            <span className="font-semibold text-gray-900 text-sm">
              Lead Scores
            </span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Synced</span>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50">
                <th className="w-10 px-3 py-2 text-center text-xs font-medium text-gray-400 border-b border-r border-gray-200 bg-gray-50" />
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 border-b border-r border-gray-200 bg-gray-50">
                  Name
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 border-b border-r border-gray-200 bg-gray-50">
                  Company
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 border-b border-r border-gray-200 bg-gray-50">
                  Score
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 border-b border-gray-200 bg-gray-50">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {LEADS.map((lead, i) => {
                const isLast = i === LEADS.length - 1;
                return (
                  <tr key={lead.name} className="group hover:bg-blue-50/50">
                    <td
                      className={cn(
                        'px-3 py-2.5 text-center text-xs text-gray-400 border-r border-gray-100 bg-gray-50/50',
                        !isLast && 'border-b',
                      )}
                    >
                      {i + 1}
                    </td>
                    <td
                      className={cn(
                        'px-4 py-2.5 text-gray-900 border-r border-gray-100 whitespace-nowrap',
                        !isLast && 'border-b',
                      )}
                    >
                      {lead.name}
                    </td>
                    <td
                      className={cn(
                        'px-4 py-2.5 text-gray-600 border-r border-gray-100',
                        !isLast && 'border-b',
                      )}
                    >
                      {lead.company}
                    </td>
                    <td
                      className={cn(
                        'px-4 py-2.5 border-r border-gray-100',
                        !isLast && 'border-b',
                      )}
                    >
                      <span
                        className={cn(
                          'inline-flex items-center justify-center w-8 h-6 rounded text-xs font-semibold',
                          lead.scoreColor,
                        )}
                      >
                        {lead.score}
                      </span>
                    </td>
                    <td
                      className={cn(
                        'px-4 py-2.5 border-gray-100',
                        !isLast && 'border-b',
                      )}
                    >
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
                          lead.statusBg,
                          lead.statusText,
                        )}
                      >
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full inline-block',
                            lead.dotColor,
                          )}
                        />
                        {lead.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Progress Dots ──

const SCENE_LABELS = [
  'AI Agent',
  'Integrations',
  'Custom Logic',
  'Human Approval',
  'Agent Data',
] as const;

function _ProgressDots({
  activeScene,
  progress,
}: {
  activeScene: SceneIndex;
  progress: number;
}) {
  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3 z-50">
      {SCENE_LABELS.map((label, i) => (
        <div key={label} className="flex flex-col items-center gap-1.5">
          <span
            className={cn(
              'text-xs font-medium transition-colors duration-300',
              activeScene === i ? 'text-gray-800' : 'text-gray-400',
            )}
          >
            {label}
          </span>
          <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-800 rounded-full"
              style={{
                transition: 'none',
                width:
                  activeScene === i
                    ? `${progress}%`
                    : i < activeScene
                    ? '100%'
                    : '0%',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Measure slot position relative to canvas (accounting for CSS scale) ──

function measureSlotPosition(
  canvasEl: HTMLDivElement,
  slotEl: HTMLDivElement,
): AgentPosition {
  const canvasRect = canvasEl.getBoundingClientRect();
  const slotRect = slotEl.getBoundingClientRect();
  const scale = canvasRect.width / canvasEl.offsetWidth || 1;

  return {
    top: (slotRect.top - canvasRect.top) / scale,
    left: (slotRect.left - canvasRect.left) / scale,
    width: slotRect.width / scale,
    height: slotRect.height / scale,
  };
}

// ── Main Component ──

function AuthAnimation() {
  const [activeIndex, setActiveIndex] = useState<SceneIndex>(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isMorphing, setIsMorphing] = useState(false);
  const [typedPrompt, setTypedPrompt] = useState('');
  const [isTypingAnim, setIsTypingAnim] = useState(false);
  const [_isInitialLoad, _setIsInitialLoad] = useState(false);
  const [agentPos, setAgentPos] = useState<AgentPosition>({
    top: 0,
    left: 0,
    width: 340,
    height: 320,
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const slot0Ref = useRef<HTMLDivElement>(null);
  const slot1Ref = useRef<HTMLDivElement>(null);
  const slot2Ref = useRef<HTMLDivElement>(null);
  const slot3Ref = useRef<HTMLDivElement>(null);
  const slot4Ref = useRef<HTMLDivElement>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const morphTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // We need a ref that tracks the latest activeIndex for use in measureSlot
  const activeIndexRef = useRef<SceneIndex>(activeIndex);
  activeIndexRef.current = activeIndex;

  const getSlotRef = useCallback(
    (index: SceneIndex): React.RefObject<HTMLDivElement | null> => {
      const refs = [slot0Ref, slot1Ref, slot2Ref, slot3Ref, slot4Ref];
      return refs[index];
    },
    [],
  );

  const measureSlot = useCallback(() => {
    const canvas = canvasRef.current;
    const slotRef = getSlotRef(activeIndexRef.current);
    const slot = slotRef.current;
    if (!canvas || !slot) return;
    setAgentPos(measureSlotPosition(canvas, slot));
  }, [getSlotRef]);

  // Start typing animation for scene 0
  const startTyping = useCallback(() => {
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    setTypedPrompt('');
    setIsTypingAnim(true);
    let i = 0;
    typingIntervalRef.current = setInterval(() => {
      if (i < FULL_PROMPT.length) {
        setTypedPrompt(FULL_PROMPT.slice(0, i + 1));
        i++;
      } else {
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        setIsTypingAnim(false);
      }
    }, TYPING_INTERVAL_MS);
  }, []);

  // Handle scene change
  const handleSceneChange = useCallback(
    (nextScene: SceneIndex) => {
      setActiveIndex(nextScene);
      setIsMorphing(true);
      if (morphTimeoutRef.current) clearTimeout(morphTimeoutRef.current);
      morphTimeoutRef.current = setTimeout(() => {
        setIsMorphing(false);
      }, MORPHING_DURATION_MS);

      if (nextScene === 0) {
        startTyping();
      }

      // Measure after DOM update
      requestAnimationFrame(() => {
        setTimeout(measureSlot, 50);
      });
    },
    [measureSlot, startTyping],
  );

  // Auto-play timer
  const stopAuto = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startAuto = useCallback(() => {
    stopAuto();
    let localProgress = 0;
    intervalRef.current = setInterval(() => {
      localProgress += 100 / TICKS_PER_SCENE;
      if (localProgress >= 100) {
        localProgress = 0;
        setActiveIndex((prev) => {
          const next = ((prev + 1) % SCENE_COUNT) as SceneIndex;
          // Trigger side effects for the new scene
          handleSceneChange(next);
          return next;
        });
      }
      setProgress(localProgress);
    }, TICK_INTERVAL_MS);
  }, [stopAuto, handleSceneChange]);

  // Play/pause effect
  useEffect(() => {
    if (isPlaying) {
      startAuto();
    } else {
      stopAuto();
    }
    return stopAuto;
  }, [isPlaying, startAuto, stopAuto]);

  // Initial setup: measure + start typing
  useEffect(() => {
    const timer = setTimeout(() => {
      measureSlot();
    }, 100);
    startTyping();
    return () => clearTimeout(timer);
  }, [measureSlot, startTyping]);

  // ResizeObserver for canvas scaling
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const observer = new ResizeObserver(() => {
      measureSlot();
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [measureSlot]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      if (morphTimeoutRef.current) clearTimeout(morphTimeoutRef.current);
    };
  }, []);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="auth-anim-scale-wrapper relative overflow-hidden rounded-2xl w-full h-full"
    >
      {/* Canvas - always renders at full 520px, CSS-scaled to fit */}
      <div
        ref={canvasRef}
        className={cn(
          'auth-anim-canvas relative overflow-hidden origin-top-left group',
          'bg-cover bg-center bg-no-repeat',
        )}
        style={{
          height: '100%',
          backgroundImage:
            'url(https://cdn.activepieces.com/assets/auth-anim-bg.webp)',
        }}
      >
        {/* Scene Title - top center */}
        <div className="absolute top-24 left-0 right-0 z-50 flex justify-center">
          <span
            key={activeIndex}
            className="text-[24px] font-bold text-black animate-[blur-in_0.6s_ease-out]"
            style={{ fontFamily: "'Sentient', serif" }}
          >
            {SCENE_LABELS[activeIndex]}
          </span>
        </div>

        {/* Play/Pause - modern glass style, visible on hover */}
        <div className="absolute top-5 left-5 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            className="relative w-7 h-7 rounded-full bg-white/15 backdrop-blur-sm hover:scale-105 transition-all duration-200 flex items-center justify-center"
            onClick={handleTogglePlay}
          >
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 28 28">
              <circle
                cx="14"
                cy="14"
                r="13"
                fill="none"
                stroke="rgba(0,0,0,0.06)"
                strokeWidth="2"
              />
              <circle
                cx="14"
                cy="14"
                r="13"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 13}
                strokeDashoffset={2 * Math.PI * 13 * (1 - progress / 100)}
                style={{ transition: 'stroke-dashoffset 100ms linear' }}
              />
            </svg>
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
        </div>

        {/* The Agent - positioned via measured slots */}
        <AgentCard
          activeIndex={activeIndex}
          position={agentPos}
          isMorphing={isMorphing}
          typedPrompt={typedPrompt}
          isTyping={isTypingAnim}
        />

        {/* Scene 0: Natural Language - always rendered, just holds the slot */}
        <div
          style={{
            display: activeIndex === 0 ? 'block' : 'none',
          }}
        >
          <Scene0Slot slotRef={slot0Ref} />
        </div>

        {/* Scene 1: Integrations */}
        <Scene1 visible={activeIndex === 1} slotRef={slot1Ref} />

        {/* Scene 2: Custom Logic (Flow View) */}
        <Scene2 visible={activeIndex === 2} slotRef={slot2Ref} />

        {/* Scene 3: Human Approval (Slack) */}
        <Scene3 visible={activeIndex === 3} slotRef={slot3Ref} />

        {/* Scene 4: Agent Data (Tables) */}
        <Scene4 visible={activeIndex === 4} slotRef={slot4Ref} />
      </div>
    </div>
  );
}

AuthAnimation.displayName = 'AuthAnimation';

export { AuthAnimation };
