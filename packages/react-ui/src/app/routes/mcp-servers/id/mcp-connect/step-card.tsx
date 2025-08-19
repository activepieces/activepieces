export const StepCard = ({
  stepNumber,
  title,
  children,
}: {
  stepNumber: number;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="flex gap-3 p-4 rounded-lg bg-background">
    <div className="flex-shrink-0">
      <div className="h-6 w-6 rounded-full bg-muted text-foreground flex items-center justify-center text-xs font-semibold">
        {stepNumber}
      </div>
    </div>
    <div className="flex-1 space-y-2">
      <h4 className="font-medium text-sm">{title}</h4>
      <div className="text-sm text-muted-foreground leading-relaxed">
        {children}
      </div>
    </div>
  </div>
);
