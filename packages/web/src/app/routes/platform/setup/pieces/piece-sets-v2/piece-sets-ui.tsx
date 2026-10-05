import { PROJECT_COLOR_PALETTE } from '@activepieces/shared';
import { t } from 'i18next';

import { LogoPlate } from '@/components/custom/logo-plate';
import { cn } from '@/lib/utils';

import {
  CatalogPiece,
  DemoProject,
  PieceSet,
  pieceSetsUtils,
} from './piece-sets-store';

export function PieceLogo({
  piece,
  size = 'sm',
}: {
  piece: CatalogPiece;
  size?: 'xs' | 'sm' | 'md';
}) {
  return (
    <LogoPlate
      src={piece.logoUrl}
      alt={piece.name}
      size={size}
      border={true}
      fallback={
        <span className="flex size-full items-center justify-center rounded-md bg-gray-12 text-xss font-semibold text-gray-1">
          {piece.name
            .split(/\s+/)
            .map((w) => w[0])
            .join('')
            .slice(0, 2)}
        </span>
      }
    />
  );
}

export function ProjectAvatar({
  project,
  className,
}: {
  project: DemoProject;
  className?: string;
}) {
  const palette = PROJECT_COLOR_PALETTE[project.color];
  return (
    <span
      className={cn(
        'flex size-5 shrink-0 items-center justify-center rounded-sm text-xss font-bold',
        className,
      )}
      style={{ backgroundColor: palette.color, color: palette.textColor }}
    >
      {project.name.charAt(0).toUpperCase()}
    </span>
  );
}

export function ProjectsCell({ set }: { set: PieceSet }) {
  if (set.sdkProjectCount > 0) {
    return (
      <span className="text-sm text-gray-11">
        {t('sdkProjectsCount', { count: set.sdkProjectCount })}
      </span>
    );
  }
  const projects = set.projectIds
    .map((id) => pieceSetsUtils.project(id))
    .filter((p): p is DemoProject => p !== undefined);
  if (projects.length === 0) {
    return <span className="text-sm text-gray-11">{t('No projects')}</span>;
  }
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="flex items-center gap-0.5">
        {projects.slice(0, 3).map((p) => (
          <ProjectAvatar key={p.id} project={p} />
        ))}
      </span>
      <span className="truncate text-sm text-gray-12">
        {projects.length <= 2
          ? projects.map((p) => p.name).join(', ')
          : t('projectsAssignedCount', { count: projects.length })}
      </span>
    </span>
  );
}

export const piecesSummary = {
  sentence(set: PieceSet): string {
    const total = pieceSetsUtils.allowedCount(set);
    const blocked = pieceSetsUtils.catalogSize() - total;
    if (set.includeNewPieces) {
      return blocked === 0
        ? t('Every piece')
        : t('everyPieceExcept', { count: blocked });
    }
    return t('onlyPiecesCount', { count: total });
  },
  timeAgo(timestamp: number): string {
    const minutes = Math.round((Date.now() - timestamp) / 60000);
    if (minutes < 1) return t('Just now');
    if (minutes < 60) return t('{count}m ago', { count: minutes });
    const hours = Math.round(minutes / 60);
    if (hours < 24) return t('{count}h ago', { count: hours });
    return t('{count}d ago', { count: Math.round(hours / 24) });
  },
};
