import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import { BarChart3 } from 'lucide-react';

import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
} from '@/components/custom/item';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { platformHooks } from '@/hooks/platform-hooks';
import { formatUtils } from '@/lib/format-utils';

import { billingQueries } from '../../hooks/billing-hooks';

export function AiCreditUsageByProject() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: usage } = billingQueries.useAiCreditUsageByProject(platform.id);

  if (isNil(usage) || usage.length === 0) {
    return null;
  }

  return (
    <Item variant="outline" className="flex-col items-stretch">
      <div className="flex items-center gap-4">
        <ItemMedia variant="icon">
          <BarChart3 />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{t('AI credits by project')}</ItemTitle>
          <ItemDescription>
            {t('AI credit usage attributed to each project')}
          </ItemDescription>
        </ItemContent>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('Project')}</TableHead>
            <TableHead className="text-right whitespace-nowrap">
              {t('This month')}
            </TableHead>
            <TableHead className="text-right whitespace-nowrap">
              {t('Total used')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usage.map((row) => (
            <TableRow key={row.projectId}>
              <TableCell>{row.projectName}</TableCell>
              <TableCell className="text-right">
                {formatUtils.formatNumber(Math.round(row.creditsThisMonth))}
              </TableCell>
              <TableCell className="text-right">
                {formatUtils.formatNumber(Math.round(row.credits))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Item>
  );
}
