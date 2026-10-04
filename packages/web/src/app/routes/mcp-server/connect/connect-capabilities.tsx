import { t } from 'i18next';
import { Blocks, History, ShieldCheck, Workflow } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ConnectCapabilities({ appCount }: { appCount: number }) {
  const items = [
    {
      icon: Workflow,
      title: t('Builds and runs flows'),
      body: t('Ask for an automation and it is built, tested and switched on.'),
    },
    {
      icon: Blocks,
      title:
        appCount > 0
          ? t('Acts in {count} apps', { count: appCount })
          : t('Acts in your apps'),
      body: t('Send the message, update the record, using your connections.'),
    },
    {
      icon: ShieldCheck,
      title: t('Stays within your access'),
      body: t('It signs in as you and sees only the projects you allow.'),
    },
    {
      icon: History,
      title: t('Leaves a trail'),
      body: (
        <>
          {t('Every action is logged with its input and result.')}{' '}
          <Link
            to="/mcp-server/activity"
            className="font-medium text-accent-11 hover:underline"
          >
            {t('See activity')}
          </Link>
        </>
      ),
    },
  ];
  return (
    <ul className="grid grid-cols-1 gap-x-8 gap-y-6 border-t pt-8 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <li key={item.title} className="flex flex-col gap-2">
          <item.icon className="size-5 text-accent-11" />
          <span className="text-sm font-medium text-gray-12">{item.title}</span>
          <span className="text-sm text-pretty text-gray-11">{item.body}</span>
        </li>
      ))}
    </ul>
  );
}
