import { AllowOnlyLoggedInUserOnlyGuard } from './allow-logged-in-user-only-guard';
import { Sidebar } from './sidebar';

export function DashboardContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AllowOnlyLoggedInUserOnlyGuard>
      <Sidebar>{children}</Sidebar>
    </AllowOnlyLoggedInUserOnlyGuard>
  );
}
