import { TextWithTooltip } from '@/components/custom/text-with-tooltip';

const TruncatedColumnTextValue = ({ value }: { value: string }) => {
  return (
    <TextWithTooltip tooltipMessage={value}>
      <div className="text-left truncate max-w-[120px] 2xl:max-w-[250px]">
        {value}
      </div>
    </TextWithTooltip>
  );
};

export { TruncatedColumnTextValue };
