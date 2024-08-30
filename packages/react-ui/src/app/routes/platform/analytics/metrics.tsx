import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building, User, Workflow, Info, Puzzle, Users, Bot } from 'lucide-react';

type MetricProps = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  value: number | string;
  description: string;
};

const Metric = ({ icon: Icon, title, value, description }: MetricProps) => {
  return (
    <Card className="flex flex-col px-4 py-2">
      <CardContent className='p-0'>
        <div className="flex flex-col">
          <div className="flex items-center gap-4">
            <Icon className='w-6 h-6' />
            <div className='flex items-center gap-2'>
              <div>{title}</div>
              <div className="tooltip">
                <Info className="w-4 h-4  text-muted-foreground" />
              </div>
            </div>
          </div>
          <div className='ml-10 text-2xl font-bold'>{value}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export function Metrics() {
  return (
    <div>
      <div className="text-xl font-semibold ">Live Metrics</div>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <Metric title="Active Flows" value="100" icon={Workflow} description='The number of active flows in the platform' />
        <Metric title="Users" value="100" icon={User} description='The number of users in the platform' />
        <Metric title="Projects" value="100" icon={Building} description='The number of projects in the platform' />
        <Metric title="Pieces Used" value="50" icon={Puzzle} description='The number of unique pieces used across all flows' />
        <Metric title="Active Users" value="75" icon={Users} description='The number of users who have been active in the last 30 days' />
        <Metric title="Flows with AI" value="30" icon={Bot} description='The number of flows that incorporate AI components' />
      </div>
    </div>
  );
}