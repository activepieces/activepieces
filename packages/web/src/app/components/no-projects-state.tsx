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
      width="180"
      height="180"
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="90" cy="164" rx="46" ry="4" className="fill-muted" />

      <rect
        x="52"
        y="40"
        width="76"
        height="12"
        rx="3"
        className="fill-muted stroke-border"
        strokeWidth="1.5"
      />

      <path
        d="M56 52 L56 148 Q56 158 66 158 L114 158 Q124 158 124 148 L124 52 Z"
        className="fill-primary/5 stroke-border"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M62 60 L62 146"
        className="stroke-background"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.9"
      />

      <g transform="translate(64 78) rotate(-8 26 22)">
        <path
          d="M2 22 L52 4 L34 44 L26 28 Z"
          className="fill-background stroke-primary"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M2 22 L26 28 L34 44"
          className="stroke-primary"
          strokeWidth="2"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M26 28 L52 4"
          className="stroke-primary/50"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="2 3"
        />
      </g>

      <circle cx="44" cy="72" r="2" className="fill-primary/30" />
      <circle cx="140" cy="98" r="1.5" className="fill-primary/30" />
      <circle cx="138" cy="130" r="2" className="fill-primary/30" />
      <circle cx="42" cy="120" r="1.5" className="fill-primary/30" />
    </svg>
  );
};
