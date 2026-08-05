export const DetailRow = ({ label, value }: DetailRowProps) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-foreground">{value}</span>
  </div>
);

type DetailRowProps = {
  label: string;
  value: string;
};
