import { Download } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { PlatformAnalyticsReport } from '@activepieces/shared';

type ReportItem = {
  name: React.ReactNode;
  value: React.ReactNode;
};

type ReportProps = {
  title: string;
  data?: ReportItem[];
  downloadCSV: () => void;
};

function Report({ title, data, downloadCSV }: ReportProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl">{title}</CardTitle>
        <Button variant="outline" size="sm" onClick={downloadCSV}>
          <Download className="mr-2 h-4 w-4" />
          Download CSV
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        {data ? (
          <ul className="space-y-2">
            {data.slice(0, 10).map((item, index) => (
              <li key={index} className="flex justify-between items-center">
                <span>{item.name}</span>
                <span className="text-muted-foreground">{item.value}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Skeleton className="h-24 w-full" />
        )}
      </CardContent>
    </Card>
  );
}

const downloadCSV = (
  data: Record<string, unknown>[] | undefined,
  title: string,
) => {
  if (!data) {
    return;
  }
  const csvContent = [
    Object.keys(data[0]).join(','),
    ...data.map((item) =>
      Object.values(item)
        .map((value) =>
          typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value,
        )
        .join(','),
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${title}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

type ReportsProps = {
  report?: PlatformAnalyticsReport;
};

function Reports({ report }: ReportsProps) {
  const topPiecesData = report?.topPieces
    .sort((a, b) => b.usageCount - a.usageCount)
    .map((piece) => ({
      name: (
        <div className="flex items-center gap-3">
          <PieceIcon
            key={piece.name}
            logoUrl={piece.logoUrl}
            displayName={piece.displayName}
            showTooltip={false}
            circle={true}
            border={true}
            size="md"
          />{' '}
          {piece.displayName}
        </div>
      ),
      value: piece.usageCount,
    }));

  const topProjectsData = report?.topProjects
    .sort((a, b) => b.activeFlows - a.activeFlows)
    .map((project) => ({
      name: <>{project.displayName}</>,
      value: project.activeFlows,
    }));

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Report
          title="Top pieces by active flows"
          data={topPiecesData}
          downloadCSV={() => downloadCSV(report?.topPieces, 'top-pieces')}
        />
        <Report
          title="Top projects by active flows"
          data={topProjectsData}
          downloadCSV={() => downloadCSV(report?.topProjects, 'top-projects')}
        />
      </div>
    </div>
  );
}

Reports.displayName = 'Reports';
export { Reports };
