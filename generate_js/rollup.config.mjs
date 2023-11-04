import terser from '@rollup/plugin-terser';
import nodeResolve from '@rollup/plugin-node-resolve';

export default {
	input: 'main.js',
	output: {
		file: '../iota_sdk_wasm.min.js',
		format: 'iife',
		plugins: [terser()]
	},
	plugins: [nodeResolve()]
};
