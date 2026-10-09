import { t } from 'i18next';
import React, { useMemo, useState } from 'react';
import { PageTitle } from '@/app/components/page-title';
import { Input } from '@/components/ui/input';
import { SYNKRA_GLOSSARY } from '@/lib/synkra-glossary';

export function GlossaryPage() {
  const [query, setQuery] = useState('');

  const entries = useMemo(() => {
    const all = Object.values(SYNKRA_GLOSSARY).sort((a, b) =>
      a.term.localeCompare(b.term),
    );
    if (!query.trim()) return all;
    const q = query.trim().toLowerCase();
    return all.filter(
      (entry) =>
        entry.term.toLowerCase().includes(q) ||
        entry.short.toLowerCase().includes(q) ||
        (entry.long ?? '').toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <PageTitle title={t('Glossary')}>
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold">{t('Glossary')}</h1>
          <p className="mt-2 text-gray-11 leading-relaxed">
            {t(
              'Every term used in Synkra Flow, explained in one or two sentences. No jargon that needs its own glossary.',
            )}
          </p>
        </header>

        <Input
          type="search"
          placeholder={t('Search terms')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mb-6"
        />

        {entries.length === 0 ? (
          <p className="text-gray-11">{t('No terms match that search.')}</p>
        ) : (
          <dl className="flex flex-col gap-6">
            {entries.map((entry) => (
              <div key={entry.term} className="border-b pb-5">
                <dt className="text-base font-semibold">{entry.term}</dt>
                <dd className="mt-1 text-sm text-gray-11 leading-relaxed">
                  {entry.long ?? entry.short}
                </dd>
                {entry.related && entry.related.length > 0 && (
                  <dd className="mt-2 text-xs text-gray-10">
                    {t('See also')}:{' '}
                    {entry.related
                      .map((key) => SYNKRA_GLOSSARY[key]?.term ?? key)
                      .join(', ')}
                  </dd>
                )}
              </div>
            ))}
          </dl>
        )}
      </div>
    </PageTitle>
  );
}
