import glslify from 'rollup-plugin-glslify'
import mkcert from 'vite-plugin-mkcert'
import legacy from '@vitejs/plugin-legacy'
export default {
	plugins: [
		glslify({
			include: [
				'**/*.vs',
				'**/*.fs',
				'**/*.vert',
				'**/*.frag',
				'**/*.glsl'
			],

			// Undefined by default
			exclude: 'node_modules/**',

			// Enabled by default
			compress: false,
		}),
		mkcert()
	],
	server: {
		https: true
	}
}