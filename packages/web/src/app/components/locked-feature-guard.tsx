import React from 'react';

import { FeatureKey, RequestTrial } from './request-trial';

type LockedFeatureGuardProps = {
  children: React.ReactNode;
  locked: boolean;
  lockTitle: string;
  lockDescription: string;
  lockVideoUrl?: string;
  lockDocumentationUrl?: string;
  featureKey: FeatureKey;
  showContactSales?: boolean;
};

export const LockedFeatureGuard = ({
  children,
  locked,
  lockTitle,
  lockDescription,
  lockVideoUrl,
  lockDocumentationUrl,
  featureKey,
  showContactSales = true,
}: LockedFeatureGuardProps) => {
  if (!locked) {
    return children;
  }

  return (
    <div className="flex w-full flex-col items-center justify-center gap-2">
      <div className="pt-8 text-center flex flex-col gap-2 justify-center items-center">
        <h1 className="text-3xl font-bold">{lockTitle}</h1>
        <div className="text-center w-[485px] my-4 flex flex-col gap-2 justify-center items-center">
          <p className="text-md leading-relaxed text-muted-foreground">
            {lockDescription}
            {lockDocumentationUrl && (
              <>
                {' '}
                <a
                  href={lockDocumentationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Learn more
                </a>
              </>
            )}
          </p>

          {showContactSales && (
            <div className="my-4">
              <RequestTrial featureKey={featureKey} />
            </div>
          )}
        </div>

        {lockVideoUrl && (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="max-w-[70vh] rounded-lg"
            controls={false}
            src={lockVideoUrl}
          />
        )}
      </div>
    </div>
  );
};

export default LockedFeatureGuard;
