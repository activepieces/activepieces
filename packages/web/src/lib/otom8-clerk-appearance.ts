// Clerk appearance tokens for otom8 — structurally identical to
// otom8-site/site/src/lib/clerk-appearance.ts. AP can't import from the site
// package (separate build), so this file mirrors it. Update both in the same
// commit when appearance changes.

import type { Appearance } from '@clerk/types';

export const otom8ClerkAppearance: Appearance = {
  variables: {
    colorBackground: '#111111',
    colorText: '#F5F5F5',
    colorTextSecondary: '#A1A1AA',
    colorInputBackground: '#0A0A0A',
    colorInputText: '#F5F5F5',
    colorPrimary: '#10B981',
    colorDanger: '#EF4444',
    borderRadius: '0.625rem',
    fontFamily: 'var(--font-sans), system-ui, sans-serif',
    fontSize: '0.9375rem',
    spacingUnit: '1rem',
  },
  elements: {
    // Sign-in / sign-up card
    card: {
      boxShadow: 'none',
      border: '1px solid rgba(255,255,255,0.08)',
      backgroundColor: '#111111',
    },
    // UserProfile / OrganizationProfile layout panels
    navbar: {
      backgroundColor: '#0A0A0A',
      borderRight: '1px solid rgba(255,255,255,0.08)',
    },
    navbarButton: {
      color: '#A1A1AA',
    },
    navbarButtonIcon: {
      color: '#A1A1AA',
    },
    // Right-side scroll area and page content
    scrollBox: {
      backgroundColor: '#111111',
    },
    pageScrollBox: {
      backgroundColor: '#111111',
    },
    page: {
      backgroundColor: '#111111',
    },
    // Section headers and content within pages
    headerTitle: {
      color: '#F5F5F5',
      fontWeight: 600,
    },
    headerSubtitle: {
      color: '#A1A1AA',
    },
    profileSectionTitle: {
      color: '#F5F5F5',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
    },
    profileSectionContent: {
      color: '#F5F5F5',
    },
    profileSectionPrimaryButton: {
      color: '#10B981',
    },
    badge: {
      backgroundColor: 'rgba(16,185,129,0.15)',
      color: '#10B981',
    },
    // Forms
    formFieldLabel: {
      fontSize: '0.8125rem',
      fontWeight: 500,
      color: '#A1A1AA',
      textTransform: 'none',
      letterSpacing: 0,
    },
    formFieldInput: {
      backgroundColor: '#0A0A0A',
      borderColor: 'rgba(255,255,255,0.08)',
      color: '#F5F5F5',
    },
    formButtonPrimary: {
      backgroundColor: '#10B981',
      color: '#FFFFFF',
      fontWeight: 500,
      textTransform: 'none',
      letterSpacing: 0,
    },
    // Social / OAuth buttons
    socialButtonsBlockButton: {
      borderColor: 'rgba(255,255,255,0.08)',
      backgroundColor: '#0A0A0A',
      color: '#F5F5F5',
      fontWeight: 500,
      transition: 'all 180ms ease',
    },
    socialButtonsBlockButtonText: { fontWeight: 500 },
    dividerLine: { backgroundColor: 'rgba(255,255,255,0.08)' },
    dividerText: {
      color: '#6B7280',
      fontSize: '0.75rem',
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
    },
    footerActionLink: {
      color: '#10B981',
      fontWeight: 500,
    },
    // UserButton popover (if used)
    userButtonPopoverCard: {
      backgroundColor: '#111111',
      borderColor: 'rgba(255,255,255,0.08)',
    },
    userButtonPopoverActionButton: {
      color: '#F5F5F5',
    },
    // Reverification / step-up modal overlay
    modalContent: {
      backgroundColor: '#111111',
      border: '1px solid rgba(255,255,255,0.08)',
    },
    modalBackdrop: {
      backgroundColor: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)',
    },
    // OTP / verification code input
    otpCodeFieldInput: {
      backgroundColor: '#0A0A0A',
      borderColor: 'rgba(255,255,255,0.12)',
      color: '#F5F5F5',
    },
  },
};
