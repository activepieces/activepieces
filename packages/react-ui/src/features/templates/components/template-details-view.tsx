import { t } from 'i18next';

import { ApMarkdown } from '@/components/custom/markdown';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PieceIconList } from '@/features/pieces/components/piece-icon-list';
import { Template, MarkdownVariant } from '@activepieces/shared';

type TemplateDetailsViewProps = {
  template: Template;
};

export const TemplateDetailsView = ({ template }: TemplateDetailsViewProps) => {
  return (
    <div className="px-2">
      <div className="mb-4 p-8 flex items-center justify-center gap-2 width-full bg-green-300 rounded-lg">
        <PieceIconList
          size="xxl"
          trigger={template.flows![0].trigger}
          maxNumberOfIconsToShow={3}
        />
      </div>
      <ScrollArea className="px-2 min-h-[156px] h-[calc(70vh-144px)] max-h-[536px]">
        <div className="mb-4 text-lg font-medium font-black">
          {template?.name}
        </div>
        <ApMarkdown
          markdown={template?.description}
          variant={MarkdownVariant.BORDERLESS}
        />

        {template.blogUrl && (
          <div className="mt-4">
            {t('Read more about this template in')}{' '}
            <a
              href={template.blogUrl}
              target="_blank"
              className="text-primary underline underline-offset-4"
              rel="noreferrer"
            >
              {t('this blog!')}
            </a>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
