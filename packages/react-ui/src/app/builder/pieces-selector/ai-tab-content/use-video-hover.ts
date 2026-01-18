import { useEffect, useState } from 'react';

export const useVideoHover = (
  videoRef: React.RefObject<HTMLVideoElement>,
) => {
  const [isVideoHovered, setIsVideoHovered] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (isVideoHovered) {
      video.play().catch(() => {
        // Silently handle play errors (e.g., autoplay restrictions)
      });
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isVideoHovered, videoRef]);

  const handleMouseEnter = () => {
    setIsVideoHovered(true);
  };

  const handleMouseLeave = () => {
    setIsVideoHovered(false);
  };

  return {
    handleMouseEnter,
    handleMouseLeave,
    isVideoHovered,
  };
};
