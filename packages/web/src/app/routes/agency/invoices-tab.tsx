import { t } from 'i18next';
import { Download, ExternalLink, FileText, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  AgencyInvoice,
  synkraAgencyHooks,
} from '@/features/synkra-agency';

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-yellow-2 text-yellow-11 border-yellow-6',
  paid: 'bg-green-2 text-green-11 border-green-6',
  overdue: 'bg-red-2 text-red-11 border-red-6',
  cancelled: 'bg-gray-3 text-gray-11 border-gray-6',
  failed: 'bg-red-2 text-red-11 border-red-6',
};

export function InvoicesTab() {
  const { data, isLoading } = synkraAgencyHooks.useInvoices();
  const regenerate = synkraAgencyHooks.useRegenerateInvoice();
  const [selected, setSelected] = useState<AgencyInvoice | null>(null);

  const invoices = data?.invoices ?? [];
  const outstanding = invoices
    .filter((i) => i.status === 'pending' || i.status === 'overdue')
    .reduce((sum, i) => sum + i.amountZar, 0);

  if (isLoading) {
    return (
      <div className="text-sm text-gray-11 py-8 text-center">
        {t('Loading invoices…')}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Outstanding card */}
      {outstanding > 0 && (
        <div className="rounded-lg border border-yellow-6 bg-yellow-2 p-4">
          <div className="text-sm font-medium text-yellow-11">
            {t('Outstanding balance')}
          </div>
          <div className="text-2xl font-semibold text-yellow-11 mt-1">
            R{outstanding.toLocaleString()}
          </div>
          <div className="text-xs text-yellow-11 mt-1">
            {t(
              'Pay all pending invoices before the grace period ends to avoid suspension.',
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-lg">{t('Invoices')}</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => regenerate.mutate()}
          disabled={regenerate.isPending}
        >
          <RefreshCw className={cn('h-4 w-4 mr-1', regenerate.isPending && 'animate-spin')} />
          {t('Generate now')}
        </Button>
      </div>

      {/* Table */}
      {invoices.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center">
          <FileText className="h-8 w-8 mx-auto text-gray-8 mb-3" />
          <div className="font-medium">{t('No invoices yet')}</div>
          <p className="text-sm text-gray-11 mt-1">
            {t(
              'Your first invoice will be generated at the end of your billing period.',
            )}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border bg-white divide-y">
          {invoices.map((inv) => (
            <button
              key={inv.id}
              className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-2 transition-colors"
              onClick={() => setSelected(inv)}
            >
              <div>
                <div className="font-medium">{inv.invoiceNumber}</div>
                <div className="text-sm text-gray-11 mt-0.5">
                  {new Date(inv.periodStart).toLocaleDateString('en-ZA')} –{' '}
                  {new Date(inv.periodEnd).toLocaleDateString('en-ZA')}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-semibold">
                    R{inv.amountZar.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-11">
                    {t('Due')} {new Date(inv.dueDate).toLocaleDateString('en-ZA')}
                  </div>
                </div>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full border px-2 py-0.5 text-xs',
                    STATUS_STYLE[inv.status] ?? '',
                  )}
                >
                  {inv.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {t('Invoice')} {selected.invoiceNumber}
                </DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-4 py-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-11">{t('Period')}</div>
                    <div>
                      {new Date(selected.periodStart).toLocaleDateString('en-ZA')} –{' '}
                      {new Date(selected.periodEnd).toLocaleDateString('en-ZA')}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-11">{t('Due date')}</div>
                    <div>{new Date(selected.dueDate).toLocaleDateString('en-ZA')}</div>
                  </div>
                  <div>
                    <div className="text-gray-11">{t('Status')}</div>
                    <div className="capitalize">{selected.status}</div>
                  </div>
                  {selected.paidAt && (
                    <div>
                      <div className="text-gray-11">{t('Paid')}</div>
                      <div>{new Date(selected.paidAt).toLocaleDateString('en-ZA')}</div>
                    </div>
                  )}
                </div>

                {/* Line items */}
                <div className="rounded-lg border bg-white divide-y">
                  {selected.lineItems.map((li, i) => (
                    <div key={i} className="flex justify-between p-3 text-sm">
                      <span>{li.description}</span>
                      <span className="font-medium">
                        R{li.totalZar.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between p-3 bg-gray-2 font-semibold">
                    <span>{t('Total')}</span>
                    <span>R{selected.amountZar.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Placeholder for PDF download once PDF generator ships
                    alert('PDF download coming soon');
                  }}
                >
                  <Download className="h-4 w-4 mr-1" />
                  {t('Download PDF')}
                </Button>
                {selected.paystackPaymentUrl && selected.status !== 'paid' && (
                  <Button asChild>
                    <a
                      href={selected.paystackPaymentUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t('Pay now')}
                      <ExternalLink className="h-4 w-4 ml-1" />
                    </a>
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
