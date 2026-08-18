export const PriceSummary = ({ label, amount, note }: PriceSummaryProps) => (
  <div className="rounded-lg border p-4 bg-primary/5 border-primary/30">
    <div className="space-y-3 animate-in fade-in duration-300">
      <div className="flex justify-between items-baseline">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-2xl font-bold text-primary">{amount}</span>
      </div>
      <div className="text-xs text-muted-foreground text-right">{note}</div>
    </div>
  </div>
);

type PriceSummaryProps = {
  label: string;
  amount: string;
  note: string;
};
