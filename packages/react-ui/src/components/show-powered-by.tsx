import { cn } from '../lib/utils';

type ShowPoweredByProps = {
  show: boolean;
  position?: 'sticky' | 'absolute' | 'static';
};
const ShowPoweredBy = ({ show, position = 'sticky' }: ShowPoweredByProps) => {
  if (!show) {
    return null;
  }
  return (
    <div
      className={cn('bottom-3 right-5 pointer-events-none ', position, {
        '-mt-[30px]': position === 'sticky',
        'mr-5': position === 'sticky',
      })}
    >
      <div
        className={cn(
          'justify-end p-1 text-muted-foreground/70 text-sm items-center flex gap-1 transition group ',
          {
            'justify-center': position === 'static',
          },
        )}
      >
        <div className=" text-sm transition">Built with</div>
        <div className="justify-center flex items-center gap-1">
          <svg
            width={15}
            height={15}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="transition fill-muted-foreground/70"
          >
            <path d="M6.46013 5.81759C5.30809 4.10962 5.75876 1.79113 7.46672 0.639093C9.17469 -0.512944 11.4932 -0.0622757 12.6452 1.64569L20.4261 13.1813C21.5781 14.8893 21.1274 17.2077 19.4195 18.3598C17.7115 19.5118 15.393 19.0611 14.241 17.3532L10.8676 12.3519C10.4339 11.8054 9.55114 11.8905 9.02108 12.4205C8.58152 12.8601 8.43761 13.9846 8.31301 14.9582C8.29474 15.1009 8.27689 15.2405 8.25858 15.3741C8.19097 16.0114 7.97092 16.6418 7.58762 17.2101C6.33511 19.067 3.81375 19.5565 1.95682 18.304C0.0998936 17.0515 -0.390738 14.5304 0.861776 12.6734C1.51136 11.7104 2.50224 11.1151 3.56472 10.9399L3.56322 10.9384C6.63307 10.4932 7.20222 7.02864 6.64041 6.08487L6.46013 5.81759Z" />
          </svg>
          <div className="font-semibold">activepieces</div>
        </div>
      </div>
    </div>
  );
};

ShowPoweredBy.displayName = 'ShowPoweredBy';
export { ShowPoweredBy };
