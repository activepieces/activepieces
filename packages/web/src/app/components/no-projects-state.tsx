import { t } from 'i18next';

export const NoProjectsState = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full px-8 py-12 gap-3 max-w-lg mx-auto text-center">
      <h1 className="text-2xl font-medium text-foreground">
        {t("You're all signed in, but you've got no projects yet.")}
      </h1>
      <p className="text-base text-muted-foreground">
        {t(
          'Give your admin a nudge — once they add you to a project, refresh and you’re in.',
        )}
      </p>
    </div>
  );
};
