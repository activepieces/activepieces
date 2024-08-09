import AlertsEmailsCard from '@/features/alerts/components/alerts-email-list-card';
import { AlertFrequencyCard } from '@/features/alerts/components/alerts-frequency-card';

export default function AlertsPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <AlertFrequencyCard />
      <AlertsEmailsCard />
    </div>
  );
}
