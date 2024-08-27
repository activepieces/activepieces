import { PieceTag } from '@/app/builder/pieces-selector/piece-tag';

export enum PieceTagEnum {
  CORE = 'CORE',
  AI = 'AI',
  APPS = 'APPS',
}

const tags: Record<
  PieceTagEnum,
  { title: string; color: 'pink' | 'yellow' | 'purple' }
> = {
  [PieceTagEnum.CORE]: {
    title: '🛠️ Core',
    color: 'pink',
  },
  [PieceTagEnum.AI]: {
    title: '🪄 AI',
    color: 'purple',
  },
  [PieceTagEnum.APPS]: {
    title: '🔗 Apps',
    color: 'yellow',
  },
};
type PieceTagGroupProps = {
  type: 'action' | 'trigger';
  selectedTag?: PieceTagEnum;
  onSelectTag: (tag: PieceTagEnum | undefined) => void;
};

const PieceTagGroup = ({
  selectedTag,
  onSelectTag,
  type,
}: PieceTagGroupProps) => {
  return (
    <div className="flex py-2 px-2">
      {Object.entries(tags)
        .filter(([tag]) => !(type === 'trigger' && tag === PieceTagEnum.AI))
        .map(([tag, tagData]) => (
          <PieceTag
            key={tagData.title}
            variant={tagData.color}
            onClick={(e) => {
              onSelectTag(
                selectedTag === tag ? undefined : (tag as PieceTagEnum),
              );
              e.stopPropagation();
            }}
            selected={selectedTag === tag}
          >
            {tagData.title}
          </PieceTag>
        ))}
    </div>
  );
};

PieceTagGroup.displayName = 'PieceTagGroup';
export { PieceTagGroup };
