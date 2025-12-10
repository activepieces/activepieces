import { Card, CardContent } from '@/components/ui/card';
import { TagWithBright } from '@/components/ui/tag-with-bright';
import { PieceIconList } from '@/features/pieces/components/piece-icon-list';
import { Template } from '@activepieces/shared';

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
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow h-full w-[320px]"
      onClick={() => onTemplateSelect(template)}
    >
      <CardContent className="py-5 px-4 flex flex-col gap-1">
        <h3 className="font-bold text-lg leading-tight h-14 line-clamp-2">
          {template.name}
        </h3>

        <p className="text-muted-foreground text-sm line-clamp-3 h-[4.5rem]">
          {template.summary}
        </p>

        <div className="h-8 flex gap-2 flex-wrap overflow-hidden">
          {displayTags.length > 0 ? (
            displayTags.map((tag, index) => (
              <TagWithBright
                key={index}
                title={tag.title}
                color={tag.color}
                size="sm"
              />
            ))
          ) : (
            <div />
          )}
        </div>

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
  );
};
