import { PlatformFeature } from '../hooks/use-feature-gate';

export const PLATFORM_FEATURES = {
  projects: {
    featureKey: 'PROJECTS',
    title: 'Unlock Projects',
    description:
      'Orchestrate your automation teams across projects with their own flows, connections and usage quotas',
    tier: 'team',
    bullets: [
      'Separate flows, connections and members per project',
      'Set credit and user quotas per project',
      'Teams work side by side without stepping on each other',
    ],
  },
  sso: {
    featureKey: 'SSO',
    title: 'Enable Single Sign On',
    description:
      'Let your users sign in with your current SSO provider or give them self serve sign up access',
    tier: 'team',
    bullets: [
      'Works with SAML and OIDC providers',
      'Enforce SSO for everyone on the platform',
      'Control who can self-serve sign up',
    ],
  },
  projectRoles: {
    featureKey: 'CUSTOM_ROLES',
    title: 'Project Role Management',
    description:
      'Define custom roles and permissions to control what your team members can access and modify',
    tier: 'team',
    bullets: [
      'Scope access per project, not per platform',
      'Keep production flows safe from accidental edits',
      'Assign roles when you invite someone',
    ],
  },
  globalConnections: {
    featureKey: 'GLOBAL_CONNECTIONS',
    title: 'Enable Global Connections',
    description: 'Manage platform-wide connections to external systems.',
    tier: 'team',
    bullets: [
      'Create once, use in any project',
      'Rotate credentials in a single place',
      'Choose which projects can use each connection',
    ],
  },
  apiKeys: {
    featureKey: 'API',
    title: 'Enable API Keys',
    description: 'Create and manage API keys to access Activepieces APIs.',
    tier: 'team',
    bullets: [
      'Drive projects, flows and connections from your own tooling',
      'Scope a key to the platform, not to a person',
      'Revoke a key without touching anyone’s login',
    ],
  },
  secretManagers: {
    featureKey: 'SECRET_MANAGERS',
    title: 'Enable Secret Managers',
    description: 'Manage your secrets from a single and secure place',
    tier: 'enterprise',
    bullets: [
      'AWS, Azure, GCP and HashiCorp Vault',
      'Secrets never leave your infrastructure',
      'One secure place to rotate everything',
    ],
  },
  auditLogs: {
    featureKey: 'AUDIT_LOGS',
    title: 'Unlock Audit Logs',
    description:
      'Comply with internal and external security policies by tracking activities done within your account',
    tier: 'enterprise',
    bullets: [
      'Every user and system action, recorded',
      'Filter by user, project and event type',
      'Export for compliance reviews',
    ],
  },
  eventStreaming: {
    featureKey: 'EVENT_DESTINATIONS',
    title: 'Unlock Event Streaming',
    description:
      'Forward every audit event we emit to a webhook, then handle it in a flow.',
    tier: 'enterprise',
    bullets: [
      'Stream events to any endpoint',
      'Wire alerts into Slack, PagerDuty or email',
      'Build your own monitoring on top',
    ],
  },
  templates: {
    featureKey: 'TEMPLATES',
    title: 'Unlock Templates',
    description:
      'Convert the most common automations into reusable templates 1 click away from your users',
    tier: 'enterprise',
    bullets: [
      'Publish reusable templates to every project',
      'One click from template to running flow',
      'Standardize how your teams automate',
    ],
  },
  embedding: {
    featureKey: 'SIGNING_KEYS',
    title: 'Unlock Embedding Through JS SDK',
    description: 'Enable signing keys to access embedding functionalities.',
    tier: 'enterprise',
    bullets: [
      'Drop the builder into your app with the JS SDK',
      'Authenticate users with signing keys',
      'Your customers automate without leaving your product',
    ],
  },
  branding: {
    featureKey: 'BRANDING',
    title: 'Unlock Branding',
    description: 'Your name, logo and colors across the entire experience.',
    tier: 'enterprise',
    bullets: [
      'Custom logo, icon, favicon and colors',
      'Branded emails and sign-in pages',
      'Your product, not ours',
    ],
  },
  pieces: {
    featureKey: 'PIECES',
    title: 'Unlock Piece Management',
    description:
      'Curate which pieces your users see, hide the rest, and add your own private pieces.',
    tier: 'enterprise',
    bullets: [
      'Show only the pieces that matter to your users',
      'Ship private pieces for internal systems',
      'Keep the catalog on-brand and focused',
    ],
  },
} satisfies Record<string, PlatformFeature>;

export type PlatformFeatureId = keyof typeof PLATFORM_FEATURES;
