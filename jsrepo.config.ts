import { defineConfig } from 'jsrepo';
import stripTypes from '@jsrepo/transform-javascript';

export default defineConfig({
  registries: ['https://reactbits.dev/r'],
  paths: {
    component: './src/components',
  },
  transforms: [stripTypes()]
});
