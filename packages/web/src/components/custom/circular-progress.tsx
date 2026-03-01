import { PolarGrid, RadialBar, RadialBarChart } from 'recharts';

import { ChartContainer } from '../ui/chart';

const ProgressCircularComponent: React.FC<{
  data: {
    plan: number;
    usage: number;
  };
  size?: 'big' | 'small';
}> = ({ data, size = 'big' }) => {
  const sizeClass = size === 'big' ? 'size-[40px]' : 'size-[25px]';
  return (
    <div className={`overflow-hidden ${sizeClass}`}>
      <ChartContainer
        config={{}}
        className={`mx-auto aspect-square max-h-[250px] min-h-[180px] ${sizeClass}`}
      >
        <RadialBarChart
          data={[
            {
              name: 'plan',
              progress: data.usage,
              fill: 'hsl(var(--primary))',
            },
          ]}
          startAngle={0}
          endAngle={(data.usage / data.plan) * 360}
          innerRadius={80}
          outerRadius={110}
          style={{
            height: size === 'big' ? 40 : 25,
          }}
        >
          <PolarGrid
            gridType="circle"
            radialLines={false}
            stroke="none"
            className="first:fill-muted last:fill-background"
            polarRadius={[86, 74]}
          />
          <RadialBar dataKey="progress" background cornerRadius={10} />
        </RadialBarChart>
      </ChartContainer>
    </div>
  );
};

export { ProgressCircularComponent };
