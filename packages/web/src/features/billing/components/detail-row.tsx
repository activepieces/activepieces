export const DetailRow = ({ label, value }: DetailRowProps) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-gray-11">{label}</span>
    <span className="font-medium text-gray-12">{value}</span>
  </div>
);

type DetailRowProps = {
  label: string;
  value: string;
};
