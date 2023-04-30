declare const Beamer: { init: () => {}; show: () => {} };
export const initialiseBeamer = () => {
  if (Beamer) {
    Beamer?.init();
  } else {
    console.error('Failed to initialise Beamer');
  }
};

export const showBeamer = () => {
  Beamer.show();
};
