import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PieceIconList } from '@/features/pieces/components/piece-icon-list';
import { Template, PROJECT_COLOR_PALETTE } from '@activepieces/shared';

type TemplateCardProps = {
  template: Template;
  onTemplateSelect: (template: Template) => void;
};

export const ExploreTemplateCard = ({
  template,
  onTemplateSelect,
}: TemplateCardProps) => {
  const displayTags = template.tags.slice(0, 2);
  const hasFlows = template.flows && template.flows.length > 0;

  return (
    <>
      <style>{`
        @keyframes shine {
          0%, 80% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
      <Card
        className="cursor-pointer hover:shadow-lg transition-shadow h-full w-[320px]"
        onClick={() => onTemplateSelect(template)}
      >
        <CardContent className="py-5 px-4 flex flex-col gap-1">
          {/* Name */}
          <h3 className="font-bold text-lg leading-tight h-14 line-clamp-2">
            {template.name}
          </h3>

          {/* Summary */}
          <p className="text-muted-foreground text-sm line-clamp-3 h-[4.5rem]">
            {template.summary}
          </p>

          {/* Tags */}
          <div className="h-8 flex gap-2 flex-wrap overflow-hidden">
            {displayTags.length > 0 ? (
              displayTags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs border-0 h-fit relative overflow-hidden"
                  style={{
                    backgroundColor: PROJECT_COLOR_PALETTE[tag.color].color,
                    color: PROJECT_COLOR_PALETTE[tag.color].textColor,
                  }}
                >
                  <span
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)`,
                      animation: 'shine 5s ease-out infinite',
                      width: '100%',
                      transform: 'translateX(-100%)',
                    }}
                  />
                  <span className="relative z-10">{tag.title}</span>
                </Badge>
              ))
            ) : (
              <div />
            )}
          </div>

          {/* Piece Icons */}
          <div className="h-10 flex items-center">
            {hasFlows && (
              <PieceIconList
                trigger={template.flows![0].trigger}
                maxNumberOfIconsToShow={4}
                size="lg"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};
