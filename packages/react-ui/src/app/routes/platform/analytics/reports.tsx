import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

type ReportItem = {
  name: string;
  value: number | string;
};

type ReportProps = {
  title: string;
  data: ReportItem[];
  valueLabel: string;
};

function downloadCSV(data: ReportItem[], title: string) {
  const csvContent = "data:text/csv;charset=utf-8," 
    + "Rank,Name,Value\n"
    + data.map((item, index) => `${index + 1},${item.name},${item.value}`).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${title.replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function Report({ title, data, valueLabel }: ReportProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{title}</CardTitle>
        <Button variant="outline" size="sm" onClick={() => downloadCSV(data, title)}>
          <Download className="mr-2 h-4 w-4" />
          Download CSV
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        <ul className="space-y-2">
          {data.map((item) => (
            <li key={item.name} className="flex justify-between items-center">
              <span>{item.name}</span>
              <span className="text-muted-foreground">{item.value} {valueLabel}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function Reports() {
  const topPiecesData: ReportItem[] = [
    { name: 'Slack', value: 1500 },
    { name: 'Google Sheets', value: 1200 },
    { name: 'Trello', value: 1000 },
    { name: 'Gmail', value: 800 },
    { name: 'Jira', value: 750 },
    { name: 'Asana', value: 600 },
    { name: 'Salesforce', value: 550 },
    { name: 'Zapier', value: 500 },
    { name: 'Notion', value: 450 },
    { name: 'GitHub', value: 400 },
  ];

  const projectTaskUsageData: ReportItem[] = [
    { name: 'Project Alpha', value: 5000 },
    { name: 'Project Beta', value: 4200 },
    { name: 'Project Gamma', value: 3800 },
    { name: 'Project Delta', value: 3500 },
    { name: 'Project Epsilon', value: 3000 },
    { name: 'Project Zeta', value: 2800 },
    { name: 'Project Eta', value: 2600 },
    { name: 'Project Theta', value: 2400 },
    { name: 'Project Iota', value: 2200 },
    { name: 'Project Kappa', value: 2000 },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Report title="Top 10 Used Pieces" data={topPiecesData} valueLabel="uses" />
      <Report title="Top 10 Projects by Task Usage" data={projectTaskUsageData} valueLabel="tasks" />
    </div>
  );
}