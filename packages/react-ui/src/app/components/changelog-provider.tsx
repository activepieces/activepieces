import { isNil, Changelog, ApFlagId } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { X } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { toast as sonnerToast } from 'sonner';

import { Button } from '@/components/ui/button';
import { SonnerToaster } from '@/components/ui/sonner';
import { flagsHooks } from '@/hooks/flags-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { changelogApi } from '@/lib/changelog-api';

interface ChangelogToastProps {
  id: string | number;
  title: string;
  content: string;
  featuredImage?: string;
  learnMoreUrl?: string;
  date: string;
  onDismiss: (id: string | number, date: string) => Promise<void>;
}

function ChangelogToast(props: ChangelogToastProps) {
  const { id, title, content, featuredImage, learnMoreUrl, date, onDismiss } =
    props;

  return (
    <div className="w-[320px] bg-white flex flex-col text-gray-800 rounded-lg shadow-xl border border-gray-200 ring-1 ring-black/5 gap-2 ">
      <div className="w-full px-4 pt-4">
        <div className="flex justify-between items-center">
          <span className="font-bold text-base tracking-tight">{title}</span>
          <Button
            variant="ghost"
            size="xs"
            className="p-0"
            onClick={async () => await onDismiss(id, date)}
          >
            <X size={16} />
          </Button>
        </div>
        <p className="text-xs text-gray-600 mt-1.5 line-clamp-2">{content}</p>
      </div>

      {featuredImage && (
        <div className="w-full flex h-[160px] items-center justify-center px-4 rounded-sm my-2">
          <img
            src={featuredImage}
            alt={title}
            className="w-full h-full object-fit pointer-events-none rounded-sm"
          />
        </div>
      )}

      <div className="flex justify-between items-center px-4 pb-4">
        <Button
          size="sm"
          onClick={() => learnMoreUrl && window.open(learnMoreUrl, '_blank')}
        >
          Learn more
        </Button>
        <Button
          variant="basic"
          className="text-body"
          onClick={async () => await onDismiss(id, date)}
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}

function showChangelogToast(props: Omit<ChangelogToastProps, 'id'>) {
  return sonnerToast.custom((id) => (
    <ChangelogToast
      id={id}
      title={props.title}
      content={props.content}
      featuredImage={props.featuredImage}
      learnMoreUrl={props.learnMoreUrl}
      date={props.date}
      onDismiss={props.onDismiss}
    />
  ));
}

export const ChangelogProvider = () => {
  const { data: user } = userHooks.useCurrentUser();
  const { data: showChangelog } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_CHANGELOG,
  );
  const { data: changelogs, isError } = useQuery({
    queryKey: ['changelogs'],
    queryFn: () => changelogApi.list(),
    enabled: !!user && showChangelog === true,
  });
  const hasShownToasts = useRef(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isMounted && !isNil(changelogs) && user && !hasShownToasts.current) {
      const filteredChangelogs = [...changelogs.data].filter(
        (changelog: Changelog) =>
          isNil(user.lastChangelogDismissed) ||
          dayjs(user.lastChangelogDismissed).isBefore(dayjs(changelog.date)),
      );

      if (filteredChangelogs.length > 0) {
        hasShownToasts.current = true;

        filteredChangelogs.forEach((changelog: Changelog) => {
          const contentWithLearnMoreLink =
            changelog.markdownContent.split('LearnMoreLink:');
          const content = contentWithLearnMoreLink[0]?.trim();
          const learnMoreLinkMarkdown = contentWithLearnMoreLink[1]?.trim();
          const learnMoreUrl =
            learnMoreLinkMarkdown?.match(/\[(.*?)\]\((.*?)\)/)?.[2];

          showChangelogToast({
            title: changelog.title,
            content: content,
            featuredImage: changelog.featuredImage,
            learnMoreUrl: learnMoreUrl,
            date: changelog.date,
            onDismiss: handleDismiss,
          });
        });
      }
    }
  }, [changelogs, user, isMounted]);

  const handleDismiss = async (id: string | number, date: string) => {
    sonnerToast.dismiss(id);
    if (user) {
      await changelogApi.dismiss({ date });
    }
  };

  if (isNil(user) || isError || !showChangelog) {
    return null;
  }

  return (
    <SonnerToaster
      position="bottom-right"
      expand={false}
      visibleToasts={2}
      duration={Infinity}
      className="rounded-lg"
    />
  );
};
