import React from 'react';
import { Bot, AppWindow, Code2, Wrench, ArrowRight, User, Table } from 'lucide-react';

type PieceBlockProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  iconColor: string;
};

const PieceBlock = ({ title, description, icon, onClick, iconColor }: PieceBlockProps) => {
  return (
    <div
      className="flex items-center gap-4 px-4 py-2 cursor-pointer hover:bg-accent transition-colors"
      onClick={onClick}
    >
      <div className={iconColor}>{icon}</div>
      <div className="flex-1 min-w-0">
        <h5 className="truncate text-sm">{title}</h5>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </div>
  );
};

const PieceBlocks = () => {
  const blocks = [
    {
      title: 'Agents',
      description: 'AI bots that do tasks and connect to other tools.',
      icon: <Bot className="h-5 w-5" />,
      iconColor: 'text-blue-700',
      onClick: () => console.log('Agents clicked'),
    },
    {
      title: 'Apps',
      description: 'Connect with popular apps.',
      icon: <AppWindow className="h-5 w-5" />,
      iconColor: 'text-green-700',
      onClick: () => console.log('Apps clicked'),
    },
    {
      title: 'Core',
      description: 'Basic tools to build flows.',
      icon: <Code2 className="h-5 w-5" />,
      iconColor: 'text-violet-700',
      onClick: () => console.log('Core clicked'),
    },
    {
      title: 'Human in the Loop',
      description: 'Add steps for people to review or approve.',
      icon: <User className="h-5 w-5" />,
      iconColor: 'text-yellow-700',
      onClick: () => console.log('Human in the Loop clicked'),
    },
    {
      title: 'Tables',
      description: 'Store and organize your data.',
      icon: <Table className="h-5 w-5" />,
      iconColor: 'text-orange-700',
      onClick: () => console.log('Tables clicked'),
    },
  ];

  return (
    <div className="flex flex-col">
      {blocks.map((block) => (
        <PieceBlock key={block.title} {...block} />
      ))}
    </div>
  );
};

export { PieceBlocks }; 