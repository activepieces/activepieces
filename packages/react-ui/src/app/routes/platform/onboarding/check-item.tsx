import { Item, ItemMedia, ItemContent, ItemTitle, ItemDescription, ItemActions } from '@/components/ui/item';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/spinner';
import { CheckCircle, ExternalLink, ShieldAlertIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

type CheckItemProps = {
  id: string;
  title: string;
  isChecked: boolean;
  message: string;
  loading: boolean;
  link?: string;
  action?: {
    label: string;
    link: string;
  };
}

const CheckItem = ({ id, title, isChecked, message, loading, link, action }: CheckItemProps) => {
  return (
    <Item variant="outline" key={id}>
    <ItemMedia variant="icon">
      {loading ? (
        <LoadingSpinner />
      ) : isChecked ? (
        <CheckCircle className="text-green-700" size={16} />
      ) : (
        <ShieldAlertIcon className="text-destructive-300" size={16} />
      )}
    </ItemMedia>
    <ItemContent>
      <ItemTitle>{title}</ItemTitle>
      <ItemDescription>
        <div
          dangerouslySetInnerHTML={{
            __html: loading ? '...' : message,
          }}
        />
      </ItemDescription>
    </ItemContent>
    {link && (
      <ItemActions>
        <a href={link} target="_blank" rel="noreferrer">
          <Button variant="outline" size="xs" asChild>
            <ExternalLink size={18} />
          </Button>
        </a>
      </ItemActions>
    )}
    {action && !isChecked && (
      <ItemActions>
        <Button variant="outline-primary" size="default">
          <Link to={action.link}>{action.label}</Link>
        </Button>
      </ItemActions>
    )}
  </Item>
  )
}

export { CheckItem }