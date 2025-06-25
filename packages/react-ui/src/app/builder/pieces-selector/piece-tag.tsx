import { cva, type VariantProps } from 'class-variance-authority';

import { cn, scrollToElementAndClickIt } from '@/lib/utils';
import { PieceTagType, tagCategoryName } from '@/lib/types';
import construction from '@/assets/img/custom/construction.png';
import link from '@/assets/img/custom/link.png';
import magic from '@/assets/img/custom/magic.png';
import { t } from 'i18next';
import { isNil } from '@activepieces/shared';

const tagVariants = cva(
  'text-xs flex gap-2 items-center justify-center font-semibold me-2 px-2.5 py-0.5 rounded-full cursor-pointer border border-transparent dark:border-[2px]',
  {
    variants: {
      variant: {
        [PieceTagType.CORE]: 'bg-pink-50 text-pink-800 hover:border-pink-400',
        [PieceTagType.APPS]:
          'bg-yellow-50 text-yellow-800 hover:border-yellow-400 ',
        [PieceTagType.AI_AND_AGENTS]:
          'bg-purple-50 text-purple-800 hover:border-purple-400 '
      },
    },
  },
);

const tagsDisplayData = [
    {
        type: PieceTagType.AI_AND_AGENTS,
        name: t('AI'),
        icon: magic
    },
    {
        type: PieceTagType.CORE,
        name: t('Core'),
        icon: construction
    },
    {
        type: PieceTagType.APPS,
        name: t('Apps'),
        icon: link
    },

] as const
export interface PieceTagProps extends VariantProps<typeof tagVariants> {
  type: PieceTagType.AI_AND_AGENTS | PieceTagType.APPS | PieceTagType.CORE;
}

const PieceTag = ({
  type,

}: PieceTagProps) => {
    const tagDisplayData = tagsDisplayData.find((tag) => tag.type === type);
    if(isNil(tagDisplayData)){
        return null;
    }
  return (
    <span
      className={cn(tagVariants({ variant:type }), {
      })}
      onClick={() => {
        const categoryName = tagCategoryName[type];
        scrollToElementAndClickIt(categoryName);
      }}
    >
      <img className='h-4' src={tagDisplayData.icon} alt={tagDisplayData.name} />
      <span>{tagDisplayData.name}</span>
    </span>
  );
};

const PieceTagsList = () => {
    const tags = [PieceTagType.CORE, PieceTagType.APPS, PieceTagType.AI_AND_AGENTS] as const;
    return (
        <div className='flex gap-2 overflow-x-auto flex-nowrap h-[38px] py-2'>
            {tags.map((tag) => (
                <PieceTag key={tag} type={tag} />
            ))}
        </div>
    )
}
PieceTagsList.displayName = 'PieceTagsList';
export { PieceTagsList };