const plugin1 = {
    name: 'ttfLoader',
    setup(build) {
        build.initialOptions.loader = {
            ...build.initialOptions.loader,
            '.ttf': 'file',
          };
    },
  };
  
  module.exports = plugin1;