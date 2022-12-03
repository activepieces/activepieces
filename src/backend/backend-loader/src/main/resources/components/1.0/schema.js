const ${COMPONENT_NAME} = require("${PACKAGE_NAME}");

exports.codePiece = async ({action}) => {
   const component = new ${COMPONENT_NAME}();
   return await component.${ACTION_NAME}(action);
};
