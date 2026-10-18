import { t } from 'i18next';
import {
  FileClock,
  Globe,
  KeyRound,
  LucideIcon,
  Server,
  Sparkles,
  UserCog,
  Users,
  Vault,
} from 'lucide-react';

import { FeatureKey } from '../components/request-trial';

import { planTiers } from './plan-tiers';

function list(): EnterpriseTrialFeature[] {
  return [
    {
      icon: KeyRound,
      title: t('Single sign-on'),
      benefit: t('Your team signs in with your identity provider.'),
      featureKeys: ['SSO'],
    },
    {
      icon: FileClock,
      title: t('Audit logs'),
      benefit: t('See who changed which flow, and when.'),
      featureKeys: ['AUDIT_LOGS', 'EVENT_DESTINATIONS'],
    },
    {
      icon: Vault,
      title: t('Secret managers'),
      benefit: t('Keep credentials in your own vault, not in flows.'),
      featureKeys: ['SECRET_MANAGERS'],
    },
    {
      icon: Sparkles,
      title: t('AI Center'),
      benefit: t('Use your own AI provider accounts in every flow and agent.'),
      featureKeys: ['UNIVERSAL_AI'],
    },
    {
      icon: UserCog,
      title: t('Custom roles'),
      benefit: t('Give every person exactly the access they need.'),
      featureKeys: ['CUSTOM_ROLES'],
    },
    {
      icon: Users,
      title: t('Unlimited users and projects'),
      benefit: t('Bring every team in without counting seats.'),
      featureKeys: ['USERS', 'PROJECTS', 'TEAM'],
    },
    {
      icon: Globe,
      title: t('Global connections'),
      benefit: t('Connect an app once and share it with every project.'),
      featureKeys: ['GLOBAL_CONNECTIONS'],
    },
    {
      icon: Server,
      title: t('Worker groups'),
      benefit: t(
        'Give critical projects workers of their own, so they never wait.',
      ),
      featureKeys: ['DEDICATED_WORKERS'],
    },
  ];
}

function lockedAfterTrial(
  plan: string | null | undefined,
): EnterpriseTrialFeature[] {
  return list().filter(
    (feature) =>
      !feature.featureKeys.every((featureKey) =>
        planTiers.planIncludes({ plan, featureKey }),
      ),
  );
}

function name(featureKey: FeatureKey | undefined): string | null {
  if (featureKey === undefined) {
    return null;
  }
  const names: Partial<Record<FeatureKey, string>> = {
    SSO: t('Single sign-on'),
    AUDIT_LOGS: t('Audit logs'),
    EVENT_DESTINATIONS: t('Event streaming'),
    SECRET_MANAGERS: t('Secret managers'),
    GLOBAL_CONNECTIONS: t('Global connections'),
    CUSTOM_ROLES: t('Custom roles'),
    SIGNING_KEYS: t('Embedding'),
    API: t('API keys'),
    TEMPLATES: t('Templates'),
    UNIVERSAL_AI: t('AI Center'),
    PIECES: t('Piece controls'),
    BRANDING: t('Custom branding'),
    PROJECTS: t('Team projects'),
    TEAM: t('Team projects'),
    USERS: t('Unlimited users'),
    ENVIRONMENT: t('Environments'),
    DEDICATED_WORKERS: t('Worker groups'),
    AGENTS: t('Agents'),
    ANALYTICS: t('Impact analytics'),
  };
  return names[featureKey] ?? null;
}

function nameInSentence(featureKey: FeatureKey | undefined): string | null {
  const featureName = name(featureKey);
  if (featureName === null) {
    return null;
  }
  const keepsCase =
    featureName.charAt(1) === featureName.charAt(1).toUpperCase();
  return keepsCase
    ? featureName
    : featureName.charAt(0).toLowerCase() + featureName.slice(1);
}

function lockedCopy(
  featureKey: FeatureKey | undefined,
): LockedFeatureCopy | null {
  if (featureKey === undefined) {
    return null;
  }
  return lockedCopyByFeature()[featureKey] ?? null;
}

function lockedCopyByFeature(): Partial<Record<FeatureKey, LockedFeatureCopy>> {
  return {
    SSO: {
      headline: t('Control who signs in with single sign-on'),
      description: t(
        'Your team signs in with the identity provider you already use, and access follows your directory.',
      ),
      benefits: [
        t('Sign in with Okta, Google, Microsoft or any SAML provider'),
        t('Provision and remove users automatically with SCIM'),
      ],
    },
    AUDIT_LOGS: {
      headline: t('See who changed which flow, and when'),
      description: t(
        'Every sign-in, publish and permission change is recorded, so you can answer audits in minutes.',
      ),
      benefits: [
        t('Search and filter every change across the platform'),
        t('Stream events to your own security tools'),
      ],
    },
    EVENT_DESTINATIONS: {
      headline: t('Send platform events to your own tools'),
      description: t(
        'Stream audit and run events to your SIEM or data warehouse as they happen.',
      ),
      benefits: [
        t('Keep a copy of every event in your own systems'),
        t('Alert your team the moment something changes'),
      ],
    },
    SECRET_MANAGERS: {
      headline: t('Keep credentials in your own vault'),
      description: t(
        'Flows read secrets from the manager you already trust, so keys never live in a flow.',
      ),
      benefits: [
        t('Rotate keys once and every flow picks them up'),
        t('Works with the secret manager you already use'),
      ],
    },
    GLOBAL_CONNECTIONS: {
      headline: t('Connect an app once, use it in every project'),
      description: t(
        'Set up a connection centrally and choose which projects can use it.',
      ),
      benefits: [
        t('No more duplicate credentials across projects'),
        t('Update a connection once for every flow'),
      ],
    },
    CUSTOM_ROLES: {
      headline: t('Give every person exactly the access they need'),
      description: t(
        'Create roles that match how your teams work, from viewers to builders.',
      ),
      benefits: [
        t('Decide who can build, publish and manage connections'),
        t('Apply the same role across many projects'),
      ],
    },
    SIGNING_KEYS: {
      headline: t('Put automations inside your own product'),
      description: t(
        'Embed the builder and your flows in your app, under your brand.',
      ),
      benefits: [
        t('Your customers automate without leaving your product'),
        t('Control which pieces and projects they see'),
      ],
    },
    API: {
      headline: t('Automate the platform from your own code'),
      description: t(
        'Create API keys to manage projects, flows and users programmatically.',
      ),
      benefits: [
        t('Provision projects and users from your systems'),
        t('Keep keys scoped and easy to revoke'),
      ],
    },
    PROJECTS: {
      headline: t('Give every team its own project'),
      description: t(
        'Separate flows, connections and members by team, with no cap on team projects.',
      ),
      benefits: [
        t('Keep each team’s work and access apart'),
        t('Add as many team projects as you need'),
      ],
    },
    USERS: {
      headline: t('Bring your whole company in'),
      description: t(
        'Invite everyone who builds or runs automations, without counting seats.',
      ),
      benefits: [
        t('Invite as many people as you need'),
        t('Control what each person can do with roles'),
      ],
    },
    BRANDING: {
      headline: t('Make the platform look like your own'),
      description: t(
        'Your logo and colors replace ours everywhere, including sign-in and emails.',
      ),
      benefits: [
        t('Use your logo, favicon and brand colors'),
        t('Give your teams a tool that feels like yours'),
      ],
    },
    PIECES: {
      headline: t('Choose exactly which pieces your users see'),
      description: t(
        'Hide what your teams should not use and add private pieces for your own systems.',
      ),
      benefits: [
        t('Show only the apps your company approves'),
        t('Publish private pieces for internal tools'),
      ],
    },
    TEMPLATES: {
      headline: t('Give your teams a head start with templates'),
      description: t(
        'Publish your own templates so every team starts from what already works.',
      ),
      benefits: [
        t('Share proven flows across the company'),
        t('Control which templates teams can see'),
      ],
    },
    AGENTS: {
      headline: t('Build an agent once, use it in any flow'),
      description: t(
        'Agents follow the instructions you write and do the work with the apps you have connected.',
      ),
      benefits: [
        t('Hand repetitive research and triage to an agent'),
        t('Reuse the same agent across every flow'),
      ],
    },
    ANALYTICS: {
      headline: t('Show the time your automations save'),
      description: t(
        'See runs, active flows and hours saved across every project in one place.',
      ),
      benefits: [
        t('Prove the value of automation to leadership'),
        t('Spot the teams and flows that save the most time'),
      ],
    },
    ENVIRONMENT: {
      headline: t('Test changes before they reach production'),
      description: t(
        'Build and test in a development project, then promote flows to production when they are ready.',
      ),
      benefits: [
        t('Keep production flows safe from half-finished edits'),
        t('Promote reviewed changes with one step'),
      ],
    },
    DEDICATED_WORKERS: {
      headline: t('Run your automations on your own workers'),
      description: t(
        'Reserve worker capacity for the projects that matter, so a busy project never slows down the rest.',
      ),
      benefits: [
        t('Flows start faster on workers that stay warm'),
        t('Give critical projects capacity of their own'),
      ],
    },
    UNIVERSAL_AI: {
      headline: t('Bring your own AI providers'),
      description: t(
        'Connect your company’s AI provider accounts and use them across every flow and agent.',
      ),
      benefits: [
        t('Use the models and accounts you already pay for'),
        t('Manage AI access for the whole platform in one place'),
      ],
    },
  };
}

export const enterpriseTrialFeatures = {
  list,
  lockedAfterTrial,
  name,
  nameInSentence,
  lockedCopy,
};

type EnterpriseTrialFeature = {
  icon: LucideIcon;
  title: string;
  benefit: string;
  featureKeys: FeatureKey[];
};

type LockedFeatureCopy = {
  headline: string;
  description: string;
  benefits: string[];
};
