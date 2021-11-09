import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import yaml from "@rollup/plugin-yaml";
import css from "rollup-plugin-css-only";
import omt from "@surma/rollup-plugin-off-main-thread";
import comlink from "@surma/rollup-plugin-comlink";
import iife from "rollup-plugin-iife";
import output from "rollup-plugin-write-output";
import copy from 'rollup-plugin-copy-glob';
import re from "rollup-plugin-re";

const production = !process.env.ROLLUP_WATCH;

export default {
	input: 'src/index.mjs',
	output: {
		sourcemap: true,
		format: 'esm',
		name: 'app',
		dir: 'docs'
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
    
    css({
      output: "bundle.css"
    }),
    
    omt(),
    
    comlink({
      autoWrap: [/\.worker\.mjs/],
      useModuleWorker: true
    }),
    
    re({
      patterns: [{
        test: /{type:\s*"module"}/,
        replace: "{}"
      }]
    }),
    
    iife(),
    
    output([
      {
        test: /index\.js$/,
        target: "docs/index.html",
        handle: (content, {htmlScripts}) => content.replace(/.*<\/body>/, `${htmlScripts}</body>`)
      },
      {
        test: /(.*\.worker.*\.js$)/,
        target: "docs/$1",
        handle: (content, {scripts}) => `importScripts(${
          scripts.slice(0, -1)
            .map(p => JSON.stringify(p))
            .join(", ")
        }); ${content}`
      }
    ]),

		// Watch the `public` directory and refresh the
		// browser on changes when not in production
		!production && livereload('docs'),

		// If we're building for production (npm run build
		// instead of npm run dev), minify
		production && terser({
      module: false
    }),
    
    copy([
      {
        files: "src/*.html",
        dest: "docs"
      }
    ]),
	],
	watch: {
		clearScreen: false
	}
};
