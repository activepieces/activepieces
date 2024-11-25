import { t } from 'i18next';

import { PieceTag } from '@/app/builder/pieces-selector/piece-tag';
// icons from google font noto
import construction from '@/assets/img/custom/construction.png';
import link from '@/assets/img/custom/link.png';
import magic from '@/assets/img/custom/magic.png';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
export enum PieceTagEnum {
  CORE = 'CORE',
  AI = 'AI',
  APPS = 'APPS',
  ALL = 'ALL',
}

const tags: Record<
  PieceTagEnum,
  {
    title: string;
    color: 'green' | 'blue' | 'purple' | 'yellow' | 'pink';
    icon?: string;
  }
> = {
  [PieceTagEnum.ALL]: {
    title: t('All'),
    color: 'blue',
  },
  [PieceTagEnum.AI]: {
    icon: magic,
    title: t('AI'),
    color: 'purple',
  },
  [PieceTagEnum.CORE]: {
    icon: construction,
    title: t('Core'),
    color: 'pink',
  },
  [PieceTagEnum.APPS]: {
    icon: link,
    title: t('Apps'),
    color: 'yellow',
  },
};

type PieceTagGroupProps = {
  type: 'action' | 'trigger';
  selectedTag?: PieceTagEnum;
  onSelectTag: (tag: PieceTagEnum) => void;
};

const PieceTagGroup = ({
  selectedTag,
  onSelectTag,
  type,
}: PieceTagGroupProps) => {
  return (
    <div className="flex py-2 px-2 gap-2 items-center">
      {Object.entries(tags).map(([tag, tagData]) => {
        const isDisabled = type === 'trigger' && tag === PieceTagEnum.AI;
        const tagComponent = (
          <PieceTag
            key={tag}
            variant={tagData.color}
            onClick={(e) => {
              if (!isDisabled) {
                onSelectTag(
                  selectedTag === tag
                    ? PieceTagEnum.ALL
                    : (tag as PieceTagEnum),
                );
                e.stopPropagation();
              }
            }}
            selected={selectedTag === tag}
            disabled={isDisabled}
          >
            <div className="flex items-center gap-2">
              {tagData.icon && (
                <img
                  src={tagData.icon}
                  alt={tagData.title}
                  className="min-w-4 h-4"
                />
              )}
              {tagData.title}
            </div>
          </PieceTag>
        );

        return isDisabled ? (
          <Tooltip key={tag}>
            <TooltipTrigger asChild>
              <div className="inline-flex">{tagComponent}</div>
            </TooltipTrigger>
            <TooltipContent>
              {type === 'trigger'
                ? t('Not available as trigger')
                : t('Not available as action')}
            </TooltipContent>
          </Tooltip>
        ) : (
          tagComponent
        );
      })}
    </div>
  );
};

PieceTagGroup.displayName = 'PieceTagGroup';
export { PieceTagGroup };
