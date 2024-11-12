export const TableTitle = ({
  children,
  description,
}: {
  children: React.ReactNode;
  description?: React.ReactNode;
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold">{children}</h1>
        {description && (
          <span className="text-md text-muted-foreground">{description}</span>
        )}
      </div>
    </div>
  );
};
TableTitle.displayName = 'TableTitle';
