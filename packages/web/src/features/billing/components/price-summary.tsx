export const PriceSummary = ({ label, amount, note }: PriceSummaryProps) => (
  <div className="rounded-xl border border-accent-6 bg-accent-3 p-4">
    <div className="flex flex-col gap-2 animate-in fade-in duration-300">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-2xl font-semibold text-accent-11 tabular-nums">
          {amount}
        </span>
      </div>
      <div className="text-right text-xs text-gray-11">{note}</div>
    </div>
  </div>
);

type PriceSummaryProps = {
  label: string;
  amount: string;
  note: string;
};
