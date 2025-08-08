import { useEffect, useState } from 'react';

function getAgentProfilePictureUrl(): string {
  return `https://cdn.activepieces.com/quicknew/agents/robots/robot_${Math.floor(
    Math.random() * 10000,
  )}.png`;
}

interface AgentImageLoadingProps {
  loading: boolean;
}

export function AgentImageLoading({ loading }: AgentImageLoadingProps) {
  const [imageUrl, setImageUrl] = useState(getAgentProfilePictureUrl());

  useEffect(() => {
    if (!loading) return;

    const interval = setInterval(() => {
      setImageUrl(getAgentProfilePictureUrl());
    }, 200);

    return () => {
      clearInterval(interval);
    };
  }, [loading]);

  return (
    <div className="flex items-center justify-center">
      <img
        src={imageUrl}
        alt="Loading Agent"
        className="w-24 h-24 rounded-full border shadow-lg transition duration-75"
      />
    </div>
  );
}
