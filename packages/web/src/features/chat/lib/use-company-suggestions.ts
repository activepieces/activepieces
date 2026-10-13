import { ApEdition, ApFlagId } from '@activepieces/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { useEffect, useState } from 'react';

import { flagsHooks } from '@/hooks/flags-hooks';

export function useCompanySuggestions({
  query,
  email,
  limit = 6,
}: {
  query: string;
  email: string | undefined;
  limit?: number;
}): CompanySuggestion[] {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const needle = query.trim().toLowerCase();
  const debouncedNeedle = useDebouncedValue({ value: needle, delayMs: 250 });
  const remoteLookupAllowed = edition === ApEdition.CLOUD;
  const remoteQuery =
    remoteLookupAllowed && debouncedNeedle.length >= 2 ? debouncedNeedle : '';
  const { data: companies, isPlaceholderData } = useQuery({
    queryKey: ['company-name-suggestions', remoteQuery],
    queryFn: () => fetchCompanies({ query: remoteQuery }),
    enabled: remoteQuery.length > 0,
    staleTime: Infinity,
    retry: false,
    placeholderData: keepPreviousData,
  });
  return mergeSuggestions({
    needle,
    email,
    companies:
      remoteQuery.length > 0 && !isPlaceholderData ? companies ?? [] : [],
    limit,
  });
}

function mergeSuggestions({
  needle,
  email,
  companies,
  limit,
}: {
  needle: string;
  email: string | undefined;
  companies: ClearbitCompany[];
  limit: number;
}): CompanySuggestion[] {
  const merged: CompanySuggestion[] = [];
  const fromEmail = emailDomainSuggestion({ email });
  const emailMatches =
    fromEmail !== null &&
    (needle.length === 0 ||
      fromEmail.value.toLowerCase().includes(needle) ||
      (fromEmail.domain ?? '').includes(needle));
  if (fromEmail && emailMatches) {
    merged.push(fromEmail);
  }
  const industries = suggestIndustries({
    needle,
    limit: needle.length === 0 ? limit : 3,
  });
  merged.push(...industries.map((value) => ({ value })));
  for (const company of companies) {
    if (merged.length >= limit) {
      break;
    }
    if (company.domain === fromEmail?.domain) {
      continue;
    }
    if (!matchesNeedle({ company, needle })) {
      continue;
    }
    merged.push({
      value: company.name,
      hint: company.domain,
      domain: company.domain,
      logo: company.logo ?? null,
    });
  }
  return merged.slice(0, limit);
}

function matchesNeedle({
  company,
  needle,
}: {
  company: ClearbitCompany;
  needle: string;
}): boolean {
  if (needle.length === 0) {
    return true;
  }
  return (
    company.name.toLowerCase().includes(needle) ||
    company.domain.toLowerCase().includes(needle)
  );
}

function emailDomainSuggestion({
  email,
}: {
  email: string | undefined;
}): CompanySuggestion | null {
  if (!email) {
    return null;
  }
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
  const name = (domain.split('.')[0] ?? '')
    .split('-')
    .map(capitalize)
    .filter((part) => part.length > 0)
    .join(' ');
  if (name.length === 0) {
    return null;
  }
  return { value: name, domain, hint: t('From your email') };
}

function suggestIndustries({
  needle,
  limit,
}: {
  needle: string;
  limit: number;
}): string[] {
  if (needle.length === 0) {
    return POPULAR_INDUSTRIES.slice(0, limit);
  }
  const startsWith: string[] = [];
  const contains: string[] = [];
  for (const label of INDUSTRIES) {
    const haystack = label.toLowerCase();
    const noArticle = haystack.replace(/^an? /, '');
    if (haystack === needle || noArticle === needle) {
      continue;
    }
    if (haystack.startsWith(needle) || noArticle.startsWith(needle)) {
      startsWith.push(label);
    } else if (haystack.includes(needle)) {
      contains.push(label);
    }
  }
  return [...startsWith, ...contains].slice(0, limit);
}

async function fetchCompanies({
  query,
}: {
  query: string;
}): Promise<ClearbitCompany[]> {
  const response = await fetch(
    `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(
      query,
    )}`,
    { signal: AbortSignal.timeout(4000) },
  );
  if (!response.ok) {
    return [];
  }
  const body: unknown = await response.json();
  if (!Array.isArray(body)) {
    return [];
  }
  return body.filter(isClearbitCompany).slice(0, 5);
}

function isClearbitCompany(value: unknown): value is ClearbitCompany {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    typeof value.name === 'string' &&
    value.name.length > 0 &&
    'domain' in value &&
    typeof value.domain === 'string' &&
    value.domain.length > 0 &&
    (!('logo' in value) ||
      typeof value.logo === 'string' ||
      value.logo === null)
  );
}

function useDebouncedValue({
  value,
  delayMs,
}: {
  value: string;
  delayMs: number;
}): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

function capitalize(value: string): string {
  if (value.length === 0) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const GENERIC_EMAIL_DOMAINS: ReadonlySet<string> = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'yahoo.com',
  'ymail.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'pm.me',
  'gmx.com',
  'mail.com',
  'zoho.com',
  'yandex.com',
  'fastmail.com',
  'hey.com',
  'qq.com',
]);

const INDUSTRIES: readonly string[] = [
  'a marketing agency',
  'an e-commerce store',
  'a SaaS company',
  'a real-estate agency',
  'a law firm',
  'an accounting firm',
  'a recruiting agency',
  'a healthcare clinic',
  'a dental practice',
  'a construction company',
  'a manufacturing company',
  'a logistics company',
  'an insurance brokerage',
  'a financial services firm',
  'a nonprofit',
  'a school',
  'a university',
  'a restaurant',
  'a hotel',
  'a retail store',
  'a design studio',
  'a software consultancy',
  'an IT services company',
  'a media company',
  'a travel agency',
  'a fitness studio',
  'a property management company',
  'a venture capital firm',
  'a government agency',
  'a freelance business',
];

const POPULAR_INDUSTRIES: readonly string[] = [
  'a marketing agency',
  'an e-commerce store',
  'a SaaS company',
  'a real-estate agency',
  'a law firm',
];

type ClearbitCompany = {
  name: string;
  domain: string;
  logo?: string | null;
};

export type CompanySuggestion = {
  value: string;
  hint?: string;
  domain?: string;
  logo?: string | null;
};
