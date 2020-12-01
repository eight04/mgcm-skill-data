import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import yaml from "@rollup/plugin-yaml";
import css from "rollup-plugin-css-only";

const production = !process.env.ROLLUP_WATCH;

export default {
	input: 'src/index.mjs',
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: 'docs/bundle.js'
	},
	plugins: [
    yaml(),
		svelte({
      compilerOptions: {
        dev: !production
      }
		}),

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration —
		// consult the documentation for details:
		// https://github.com/rollup/rollup-plugin-commonjs
		resolve({ browser: true }),

		// Watch the `public` directory and refresh the
		// browser on changes when not in production
		!production && livereload('docs'),

		// If we're building for production (npm run build
		// instead of npm run dev), minify
		production && terser(),
    css({
      output: "bundle.css"
    })
	],
	watch: {
		clearScreen: false
	}
};
