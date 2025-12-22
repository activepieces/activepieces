import { t } from 'i18next';
import { Loader2, Receipt } from 'lucide-react';
import { useState } from 'react';

import { Badge, BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  PlatformAiCreditsPaymentStatus,
  PlatformAiCreditsPaymentType,
  PlatformAiCreditsPayment,
} from '@activepieces/shared';

import { billingMutations } from '../../lib/billing-hooks';

interface AICreditsPaymentHistoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AICreditsPaymentHistoryDialog({
  isOpen,
  onOpenChange,
}: AICreditsPaymentHistoryDialogProps) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  const { data, isLoading, isError } = billingMutations.useAICreditPayments({
    limit: 10,
    cursor,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{t('Payment History')}</DialogTitle>
        </DialogHeader>

        <div className="min-h-[300px] max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center h-40 text-destructive">
              {t('Failed to load payment history')}
            </div>
          ) : !data?.data || data.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
              <Receipt className="w-8 h-8 opacity-50" />
              <p>{t('No payments found')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Date')}</TableHead>
                  <TableHead>{t('Type')}</TableHead>
                  <TableHead>{t('Credits')}</TableHead>
                  <TableHead>{t('Amount')}</TableHead>
                  <TableHead>{t('Status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((payment: PlatformAiCreditsPayment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(payment.created)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {payment.type ===
                        PlatformAiCreditsPaymentType.AUTO_TOPUP
                          ? t('Auto Top-up')
                          : t('Manual Purchase')}
                      </Badge>
                    </TableCell>
                    <TableCell>{payment.aiCredits.toLocaleString()}</TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(payment.status)}>
                        {getStatusLabel(payment.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {data?.next && (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCursor(data.next!)}
            >
              {t('Next Page')}
            </Button>
          </div>
        )}
        {data?.previous && (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCursor(data.previous!)}
            >
              {t('Previous Page')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString();
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const getStatusBadgeVariant = (
  status: PlatformAiCreditsPaymentStatus,
): BadgeProps['variant'] => {
  switch (status) {
    case PlatformAiCreditsPaymentStatus.PAYMENT_SUCCESS:
    case PlatformAiCreditsPaymentStatus.DONE:
      return 'success';
    case PlatformAiCreditsPaymentStatus.PAYMENT_FAILED:
      return 'destructive';
    case PlatformAiCreditsPaymentStatus.PAYMENT_PENDING:
      return 'outline';
    default:
      return 'outline';
  }
};

const getStatusLabel = (status: PlatformAiCreditsPaymentStatus) => {
  switch (status) {
    case PlatformAiCreditsPaymentStatus.PAYMENT_SUCCESS:
    case PlatformAiCreditsPaymentStatus.DONE:
      return t('Succeeded');
    case PlatformAiCreditsPaymentStatus.PAYMENT_FAILED:
      return t('Failed');
    case PlatformAiCreditsPaymentStatus.PAYMENT_PENDING:
      return t('Pending');
    default:
      return status;
  }
};
