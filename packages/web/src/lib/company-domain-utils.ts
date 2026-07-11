// Mirrors GENERIC_EMAIL_DOMAINS in
// packages/server/api/src/app/ee/chat/chat-user-identity.ts — keep in sync.
const GENERIC_EMAIL_DOMAINS: ReadonlySet<string> = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'hotmail.co.uk',
  'live.com',
  'msn.com',
  'yahoo.com',
  'yahoo.co.uk',
  'ymail.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'pm.me',
  'gmx.com',
  'gmx.net',
  'mail.com',
  'zoho.com',
  'yandex.com',
  'yandex.ru',
  'fastmail.com',
  'hey.com',
  'tutanota.com',
  'qq.com',
  '163.com',
  '126.com',
]);

const HOSTNAME_PATTERN =
  /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

const FALLBACK_WORKSPACE_NAME = 'My Workspace';

function companyDomainFromEmail(email: string): string | null {
  const at = email.lastIndexOf('@');
  if (at < 0) {
    return null;
  }
  const domain = email
    .slice(at + 1)
    .toLowerCase()
    .trim();
  if (domain.length === 0 || GENERIC_EMAIL_DOMAINS.has(domain)) {
    return null;
  }
  return domain;
}

// Best-effort hostname extraction from whatever the user typed —
// "https://www.Acme.com/about?x=1" → "acme.com". Heuristic only: no
// public-suffix list ("co.uk" alone yields "co"), punycode/IDN untouched.
// The backend research job upgrades the derived name later anyway.
function normalizeWebsite(input: string): string | null {
  let value = input.trim().toLowerCase();
  if (value.length === 0) {
    return null;
  }
  value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//, '').replace(/^\/\//, '');
  const cutAt = value.search(/[/?#:]/);
  if (cutAt >= 0) {
    value = value.slice(0, cutAt);
  }
  value = value.replace(/\.$/, '');
  const labels = value.split('.');
  if (labels[0] === 'www' || labels[0] === 'mail') {
    labels.shift();
  }
  value = labels.join('.');
  if (!HOSTNAME_PATTERN.test(value)) {
    return null;
  }
  return value;
}

// The instant workspace-name placeholder. Must always satisfy the platform
// name rule (SAFE_STRING_PATTERN: no '.' or '/'). "acme-widgets.com" →
// "Acme Widgets"; no website + "ash.sam@gmail.com" → "Ash".
function deriveWorkspaceName({
  website,
  email,
}: {
  website: string | null;
  email: string | null;
}): string {
  if (website) {
    const label = website.split('.')[0] ?? '';
    const name = titleCaseLabel(label);
    if (name.length > 0) {
      return name;
    }
  }
  if (email) {
    const at = email.indexOf('@');
    const localPart = at >= 0 ? email.slice(0, at) : email;
    const firstToken = localPart.split(/[._+-]/)[0] ?? '';
    const cleaned = firstToken.replace(/[^a-zA-Z0-9]/g, '');
    if (cleaned.length > 0) {
      return capitalize(cleaned);
    }
  }
  return FALLBACK_WORKSPACE_NAME;
}

function titleCaseLabel(label: string): string {
  return label
    .split('-')
    .map((part) => capitalize(part))
    .filter((part) => part.length > 0)
    .join(' ');
}

function capitalize(value: string): string {
  if (value.length === 0) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export const companyDomainUtils = {
  companyDomainFromEmail,
  normalizeWebsite,
  deriveWorkspaceName,
};
