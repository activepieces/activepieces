import { PieceTag } from '@/app/builder/pieces-selector/piece-tag';
// icons from google font noto
import construction from '@/assets/img/custom/construction.png';
import link from '@/assets/img/custom/link.png';
import magic from '@/assets/img/custom/magic.png';
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
    title: 'All',
    color: 'blue',
  },
  [PieceTagEnum.AI]: {
    icon: magic,
    title: 'AI',
    color: 'purple',
  },
  [PieceTagEnum.CORE]: {
    icon: construction,
    title: 'Core',
    color: 'pink',
  },

  [PieceTagEnum.APPS]: {
    icon: link,
    title: 'Apps',
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
      {Object.entries(tags)
        .filter(([tag]) => !(type === 'trigger' && tag === PieceTagEnum.AI))
        .map(([tag, tagData]) => (
          <PieceTag
            key={tagData.title}
            variant={tagData.color}
            onClick={(e) => {
              onSelectTag(
                selectedTag === tag ? PieceTagEnum.ALL : (tag as PieceTagEnum),
              );
              e.stopPropagation();
            }}
            selected={selectedTag === tag}
          >
            <div className="flex items-center gap-2">
              {tagData.icon && (
                <img
                  src={tagData.icon}
                  alt={tagData.title}
                  className="w-4 h-4"
                />
              )}
              {tagData.title}
            </div>
          </PieceTag>
        ))}
    </div>
  );
};

PieceTagGroup.displayName = 'PieceTagGroup';
export { PieceTagGroup };
