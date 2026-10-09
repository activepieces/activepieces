import { t } from 'i18next';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PageTitle } from '@/app/components/page-title';
import { api } from '@/lib/api';

type PreflightCheck = {
  key: string;
  label: string;
  ok: boolean;
  envVar: string;
  hint: string;
};

type PreflightResponse = {
  ok: boolean;
  checks: PreflightCheck[];
};

const PreflightPage = () => {
  const { data, isLoading, error } = useQuery<PreflightResponse>({
    queryKey: ['synkra-preflight'],
    queryFn: () => api.get<PreflightResponse>('/v1/synkra/preflight'),
    refetchInterval: 30_000,
  });

  return (
    <PageTitle title={t('Preflight')}>
      <div className="mx-auto w-full max-w-3xl p-6 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t('Preflight checklist')}</h1>
          <p className="text-sm text-gray-11 mt-1">
            {t('Environment readiness for V1 launch. Auto-refreshes every 30 seconds.')}
          </p>
        </div>

        {isLoading && <div className="text-sm text-gray-11">{t('Loading…')}</div>}
        {error && (
          <div className="rounded-lg border border-red-6 bg-red-2 p-4 text-sm text-red-11">
            {t('Could not load preflight. Owner access only.')}
          </div>
        )}

        {data && (
          <>
            <div
              className={`rounded-lg border p-4 flex items-center gap-3 ${
                data.ok ? 'border-green-6 bg-green-2' : 'border-yellow-6 bg-yellow-2'
              }`}
            >
              {data.ok ? (
                <CheckCircle2 className="h-5 w-5 text-green-11" />
              ) : (
                <XCircle className="h-5 w-5 text-yellow-11" />
              )}
              <div className="font-medium">
                {data.ok
                  ? t('All checks passed — ready to launch')
                  : t('{{n}} of {{total}} checks need attention', {
                      n: data.checks.filter((c) => !c.ok).length,
                      total: data.checks.length,
                    })}
              </div>
            </div>

            <div className="rounded-lg border bg-white divide-y">
              {data.checks.map((c) => (
                <div key={c.key} className="flex items-start gap-3 p-4">
                  {c.ok ? (
                    <CheckCircle2 className="h-5 w-5 text-green-10 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-10 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{c.label}</div>
                    <div className="text-sm text-gray-11 mt-0.5">{c.hint}</div>
                    <div className="text-xs text-gray-9 font-mono mt-1 break-all">
                      {c.envVar}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </PageTitle>
  );
};

export default PreflightPage;
