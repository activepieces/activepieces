import React from 'react';

import { RequestTrial } from './request-trial';

type LockedFeatureGuardProps = {
  children: React.ReactNode;
  locked: boolean;
  lockTitle: string;
  lockDescription: string;
  lockVideoUrl: string;
};

export const LockedFeatureGuard = ({
  children,
  locked,
  lockTitle,
  lockDescription,
  lockVideoUrl,
}: LockedFeatureGuardProps) => {
  if (!locked) {
    return children;
  }

  return (
    <div className="flex p-16 w-screen flex-col items-center justify-center gap-2">
      <div className="text-center flex flex-col gap-2 justify-center items-center">
        <h1 className="text-3xl font-bold">{lockTitle}</h1>
        <div className="text-center w-[485px] my-4 flex flex-col gap-2 justify-center items-center">
          <p className="text-md leading-relaxed text-muted-foreground">
            {lockDescription}
          </p>

          <div className="my-4">
            <RequestTrial />
          </div>
        </div>

        <video
          autoPlay
          loop
          muted
          playsInline
          className="max-w-full rounded-lg"
          controls={false}
          src={lockVideoUrl}
        />
      </div>
    </div>
  );
};

export default LockedFeatureGuard;
