import { FullLogo } from '@/components/custom/full-logo';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

function AuthPage({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh w-full flex-col items-center justify-center gap-4 bg-gray-1 px-4 py-12">
      <FullLogo className="h-8" />
      <div className="flex w-full max-w-sm flex-col gap-4">{children}</div>
    </main>
  );
}

function AuthCard({ title, description, children, className }: AuthCardProps) {
  return (
    <Card className={cn('w-full gap-4 px-6 py-6', className)}>
      {title && <AuthHeading title={title} description={description} />}
      {children}
    </Card>
  );
}

function AuthHeading({ title, description }: AuthHeadingProps) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-xl font-semibold text-gray-12">{title}</h1>
      {description && <p className="text-sm text-gray-11">{description}</p>}
    </div>
  );
}

export { AuthPage, AuthCard, AuthHeading };

type AuthHeadingProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
};

type AuthCardProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};
