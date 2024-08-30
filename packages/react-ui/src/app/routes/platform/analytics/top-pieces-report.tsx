import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type PieceUsage = {
  name: string;
  usageCount: number;
};

const dummyData: PieceUsage[] = [
  { name: 'Slack', usageCount: 1500 },
  { name: 'Google Sheets', usageCount: 1200 },
  { name: 'Trello', usageCount: 1000 },
  { name: 'Gmail', usageCount: 800 },
  { name: 'Jira', usageCount: 750 },
  { name: 'Asana', usageCount: 600 },
  { name: 'Salesforce', usageCount: 550 },
  { name: 'Zapier', usageCount: 500 },
  { name: 'Notion', usageCount: 450 },
  { name: 'GitHub', usageCount: 400 },
];

export function TopPiecesReport() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 10 Used Pieces</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {dummyData.map((piece, index) => (
            <li key={piece.name} className="flex justify-between items-center">
              <span>{index + 1}. {piece.name}</span>
              <span className="text-muted-foreground">{piece.usageCount} uses</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}