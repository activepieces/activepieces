import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PieceIconList } from '@/features/pieces/components/piece-icon-list';
import { PieceIcon } from '@/features/pieces/components/piece-icon';

interface AgentCardProps {
  picture: string;
  title: string;
  description: string;
}

export const AgentCard: React.FC<AgentCardProps> = ({ picture, title, description }) => {
  return (
    <div className="flex flex-col">
      <Card className="w-full h-[135px] cursor-pointer hover:border-gray-400 transition-colors duration-200 flex flex-col justify-between">
        <CardContent className="p-4 flex flex-col h-full">
          <div className="flex gap-4 items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <img src={picture} alt={title} className="w-full h-full rounded-sm object-cover" />
              </div>
            </div>
            <div className="flex-grow flex flex-col gap-1 min-w-0">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold text-lg">{title}</h2>
              </div>
              <div
                className="text-left text-sm text-muted-foreground mt-0.5 line-clamp-2"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  minHeight: '2.5em',
                }}
              >
                {description}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
