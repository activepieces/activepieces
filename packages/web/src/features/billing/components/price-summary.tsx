export const PriceSummary = ({ label, amount, note }: PriceSummaryProps) => (
  <div className="rounded-lg border p-4 bg-accent-3 border-accent-6">
    <div className="space-y-3 animate-in fade-in duration-300">
      <div className="flex justify-between items-baseline">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-xl font-semibold text-accent-11">{amount}</span>
      </div>
      <div className="text-sm text-gray-11 text-right">{note}</div>
    </div>
  </div>
);

type PriceSummaryProps = {
  label: string;
  amount: string;
  note: string;
};
