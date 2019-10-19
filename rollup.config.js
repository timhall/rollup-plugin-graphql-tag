import builtin from 'builtin-modules';
import babel from 'rollup-plugin-babel';
import pkg from './package.json';

const external = Object.keys(pkg.dependencies).concat(builtin);

export default {
  input: 'src/index.ts',
  output: [
    { file: pkg.main, format: 'cjs', sourcemap: true },
    { file: pkg.module, format: 'es', sourcemap: true }
  ],
  external,
  plugins: [babel({ extensions: ['.ts'] })]
};
