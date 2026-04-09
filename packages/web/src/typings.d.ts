declare module 'react-lottie' {
  import { Component } from 'react';
  interface LottieOptions {
    loop?: boolean;
    autoplay?: boolean;
    animationData: unknown;
    rendererSettings?: {
      preserveAspectRatio?: string;
    };
  }
  interface LottieProps {
    options: LottieOptions;
    height?: number | string;
    width?: number | string;
    isClickToPauseDisabled?: boolean;
  }
  export default class Lottie extends Component<LottieProps> {}
}

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.sass' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.less' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.styl' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.bmp' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}
