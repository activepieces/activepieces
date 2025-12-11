import { t } from 'i18next';
import { CheckCircle, ExternalLink, XCircle } from 'lucide-react';

import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from '@/components/ui/item';
import { LoadingSpinner } from '@/components/ui/spinner';

type CheckItemProps = {
  id: string;
  title: string;
  icon: React.ReactNode;
  isChecked: boolean;
  message: React.ReactNode | string;
  loading: boolean;
  link?: string;
};

const CheckItem = ({
  id,
  title,
  icon,
  isChecked,
  message,
  loading,
  link,
}: CheckItemProps) => {
  return (
    <Item variant="outline" key={id}>
      <ItemMedia variant="icon">
        {loading ? <LoadingSpinner /> : icon}
      </ItemMedia>
      <ItemContent>
        <ItemTitle>
          {title}
          {link && (
            <a href={link} target="_blank" rel="noreferrer">
              <ExternalLink size={18} />
            </a>
          )}
        </ItemTitle>
        <ItemDescription className="line-clamp-4">{message}</ItemDescription>
      </ItemContent>
      <ItemActions>
        {isChecked ? (
          <div className="text-green-700 flex items-center gap-2">
            <CheckCircle size={18} />
            {t('Passed')}
          </div>
        ) : (
          <div className="text-destructive-300 flex items-center gap-2">
            <XCircle size={18} />
            {t('Needs Attention')}
          </div>
        )}
      </ItemActions>
    </Item>
  );
};

export { CheckItem };
