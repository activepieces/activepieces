import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { platformHooks } from '@/hooks/platform-hooks';

export default function ProjectsPage() {
  const { platform } = platformHooks.useCurrentPlatform();
  const isEnabled = platform.manageProjectsEnabled;
  return (
    <LockedFeatureGuard
      locked={!isEnabled}
      lockTitle="Unlock Projects"
      lockDescription="Orchestrate your automation teams across projects with their own flows, connections and usage quotas"
      lockVideoUrl="https://cdn.activepieces.com/videos/showcase/projects.mp4"
    >
      {null}
    </LockedFeatureGuard>
  );
}
