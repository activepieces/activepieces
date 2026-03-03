import { Separator } from '@/components/ui/separator';

export const CenteredPage = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="max-w-[40rem] mx-auto py-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-medium">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Separator className="my-4" />
      {children}
    </div>
  );
};
