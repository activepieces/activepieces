import { t } from 'i18next';

import { Badge } from '@/components/ui/badge';

export const NoProjectsState = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full px-8 py-12 gap-6 max-w-md mx-auto text-center">
      <MascotIllustration />

      <Badge
        variant="secondary"
        className="bg-primary/10 text-primary hover:bg-primary/10 gap-1.5 font-medium"
      >
        <span className="size-1.5 rounded-full bg-primary" />
        {t('Waiting for access')}
      </Badge>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">
          {t("You're all signed in, but you've got no projects yet.")}
        </h1>
        <p className="text-base text-muted-foreground">
          {t(
            "You haven't been added to a project. Ask your workspace admin to invite you and you'll be up and running in no time.",
          )}
        </p>
      </div>
    </div>
  );
};

const MascotIllustration = () => {
  return (
    <div className="relative w-48 h-40">
      <svg
        aria-hidden="true"
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 192 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="30"
          y="34"
          width="24"
          height="24"
          rx="6"
          transform="rotate(-12 42 46)"
          className="fill-emerald-200 stroke-emerald-400"
          strokeWidth="1.5"
        />
        <rect
          x="140"
          y="30"
          width="22"
          height="22"
          rx="6"
          transform="rotate(15 151 41)"
          className="fill-amber-200 stroke-amber-400"
          strokeWidth="1.5"
        />

        <ellipse cx="96" cy="140" rx="46" ry="4" className="fill-muted" />

        <path
          d="M62 56 Q62 46 72 46 L120 46 Q130 46 130 56 L136 96 Q136 130 116 130 L76 130 Q56 130 56 96 Z"
          className="fill-primary/10 stroke-primary"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        <ellipse cx="82" cy="86" rx="3" ry="4" className="fill-primary" />
        <ellipse cx="110" cy="86" rx="3" ry="4" className="fill-primary" />

        <ellipse cx="74" cy="100" rx="5" ry="3" className="fill-primary/25" />
        <ellipse cx="118" cy="100" rx="5" ry="3" className="fill-primary/25" />

        <path
          d="M84 102 Q96 112 108 102"
          className="stroke-primary"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
};
