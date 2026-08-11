import { t } from 'i18next';

export const NoProjectsState = () => {
  return (
    <div className="flex flex-col items-start justify-center h-full w-full px-8 py-12 gap-6 max-w-lg mx-auto">
      <PaperAirplaneInJar />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium text-foreground">
          {t("You're all signed in, but you've got no projects yet.")}
        </h1>
        <p className="text-base text-muted-foreground">
          {t(
            'Give your admin a nudge — once they add you to a project, refresh and you’re in.',
          )}
        </p>
      </div>
    </div>
  );
};

const PaperAirplaneInJar = () => {
  return (
    <svg
      aria-hidden="true"
      className="text-primary"
      width="160"
      height="160"
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="80" cy="140" rx="34" ry="4" className="fill-muted" />
      <path
        d="M46 60 Q46 56 50 56 L110 56 Q114 56 114 60 L110 138 Q110 142 106 142 L54 142 Q50 142 50 138 Z"
        className="fill-background stroke-border"
        strokeWidth="2"
      />
      <path
        d="M46 60 L114 60"
        className="stroke-border"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M52 68 L108 68"
        className="stroke-border/60"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <g transform="translate(52 72) rotate(-15 28 28)">
        <path
          d="M4 30 L56 8 L36 52 L28 34 Z"
          className="fill-primary/20 stroke-primary"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M4 30 L28 34 L36 52"
          className="stroke-primary"
          strokeWidth="2"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M28 34 L56 8"
          className="stroke-primary"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
      <path
        d="M42 96 Q40 100 42 104"
        className="stroke-primary/40"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M118 92 Q120 96 118 100"
        className="stroke-primary/40"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
};
