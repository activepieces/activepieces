import { PlatformFeature } from '../hooks/use-feature-gate';

export const PLATFORM_FEATURES = {
  projects: {
    featureKey: 'PROJECTS',
    title: 'Team projects',
    description:
      'A separate space per team, with its own flows, connections and members, and its own usage limits.',
    tier: 'team',
    bullets: [
      'Separate flows, connections and members per project',
      'Set credit and user quotas per project',
      'Teams work side by side without stepping on each other',
    ],
  },
  sso: {
    featureKey: 'SSO',
    title: 'Single sign-on',
    description:
      "Let people sign in with Google or any SAML 2.0 provider such as Okta or Entra, and limit sign-up to your company's email domains.",
    tier: 'team',
    bullets: [
      'Works with SAML and OIDC providers',
      'Enforce SSO for everyone on the platform',
      'Control who can self-serve sign up',
    ],
  },
  projectRoles: {
    featureKey: 'CUSTOM_ROLES',
    title: 'Custom roles',
    description:
      "Build a role from individual permissions, like an operator who can retry runs but can't edit flows, and assign it per project.",
    tier: 'team',
    bullets: [
      'Scope access per project, not per platform',
      'Keep production flows safe from accidental edits',
      'Assign roles when you invite someone',
    ],
  },
  globalConnections: {
    featureKey: 'GLOBAL_CONNECTIONS',
    title: 'Global connections',
    description:
      'Connect the company Slack, Gmail or Stripe once, share it with the projects that need it, and rotate it in one place.',
    tier: 'team',
    bullets: [
      'Create once, use in any project',
      'Rotate credentials in a single place',
      'Choose which projects can use each connection',
    ],
  },
  apiKeys: {
    featureKey: 'API',
    title: 'API keys',
    description:
      'Create projects, invite people and manage flows from your own scripts or CI. Keys belong to the platform, not to a person.',
    tier: 'team',
    bullets: [
      'Drive projects, flows and connections from your own tooling',
      'Scope a key to the platform, not to a person',
      'Revoke a key without touching anyone’s login',
    ],
  },
  secretManagers: {
    featureKey: 'SECRET_MANAGERS',
    title: 'Secret managers',
    description:
      'Connections read credentials from HashiCorp Vault, AWS, Azure or GCP when a flow runs. Nothing secret is stored here.',
    tier: 'enterprise',
    bullets: [
      'AWS, Azure, GCP and HashiCorp Vault',
      'Secrets never leave your infrastructure',
      'One secure place to rotate everything',
    ],
  },
  auditLogs: {
    featureKey: 'AUDIT_LOGS',
    title: 'Audit logs',
    description:
      'Every meaningful action on the platform: who did it, when, and what it touched. Filter it, or export it for a security review.',
    tier: 'enterprise',
    bullets: [
      'Every user and system action, recorded',
      'Filter by user, project and event type',
      'Export for compliance reviews',
    ],
  },
  eventStreaming: {
    featureKey: 'EVENT_DESTINATIONS',
    title: 'Event streaming',
    description:
      'Send every audit event to a webhook you own, or handle it in a flow to alert Slack or PagerDuty.',
    tier: 'enterprise',
    bullets: [
      'Stream events to any endpoint',
      'Wire alerts into Slack, PagerDuty or email',
      'Build your own monitoring on top',
    ],
  },
  templates: {
    featureKey: 'TEMPLATES',
    title: 'Templates',
    description:
      'Turn the flows your teams keep rebuilding into one-click starting points, published to everyone on the platform.',
    tier: 'enterprise',
    bullets: [
      'Publish reusable templates to every project',
      'One click from template to running flow',
      'Standardize how your teams automate',
    ],
  },
  embedding: {
    featureKey: 'SIGNING_KEYS',
    title: 'Embedding',
    description:
      'Put the flow builder and connections inside your own product with the JS SDK. Your app signs a token, and users and projects are created on first use.',
    tier: 'enterprise',
    bullets: [
      'Drop the builder into your app with the JS SDK',
      'Authenticate users with signing keys',
      'Your customers automate without leaving your product',
    ],
  },
  branding: {
    featureKey: 'BRANDING',
    title: 'Branding',
    description:
      'Your name, logo and colors on every screen, email and sign-in page.',
    tier: 'enterprise',
    bullets: [
      'Custom logo, icon, favicon and colors',
      'Branded emails and sign-in pages',
      'Your product, not ours',
    ],
  },
  pieces: {
    featureKey: 'PIECES',
    title: 'Piece management',
    description:
      'Choose which pieces your users can build with, hide the rest, and install private pieces for your internal systems.',
    tier: 'enterprise',
    bullets: [
      'Show only the pieces that matter to your users',
      'Ship private pieces for internal systems',
      'Keep the catalog on-brand and focused',
    ],
  },
  aiProviders: {
    featureKey: 'UNIVERSAL_AI',
    title: 'Unlock AI Center',
    description:
      'Bring your own AI provider keys and choose the models that power your automations',
    tier: 'plus',
    bullets: [
      'Connect OpenAI, Anthropic, Google and more',
      'Pick the default model for each AI capability',
      'Pay your provider directly, with no model markup',
    ],
  },
} satisfies Record<string, PlatformFeature>;

export type PlatformFeatureId = keyof typeof PLATFORM_FEATURES;
