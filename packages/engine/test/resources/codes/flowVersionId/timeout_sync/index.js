module.exports = {
    code: async (params) => {
      const start = Date.now();
      while (Date.now() - start < 10000) {}
      return params;
    }
  };
