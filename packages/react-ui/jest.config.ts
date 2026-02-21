/* eslint-disable */
export default {
  displayName: 'react-ui',
  preset: '../../jest.preset.js',
  transform: {
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/packages/react-ui',
};
