import AlertsEmailsCard from '@/app/routes/settings/alerts/alerts-email-list-card';
import { AlertFrequencyCard } from '@/app/routes/settings/alerts/alerts-frequency-card';

export default function AlertsPage() {
  return (
    <div className="w-full flex flex-col items-center justify-center gap-4">
      <AlertFrequencyCard />
      <AlertsEmailsCard />
    </div>
  );
}
