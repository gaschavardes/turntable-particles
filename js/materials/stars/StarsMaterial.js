import { RawShaderMaterial } from 'three'

import vertexShader from './vert.glsl'
import fragmentShader from './frag.glsl'

export default class StarsMaterial extends RawShaderMaterial {
	constructor(size = 5000) {
		super({
			vertexShader,
			fragmentShader,
			transparent: true,
			opacity: 1,
			uniforms: {
				uTime: store.WebGL.globalUniforms.uTime,
				uSize: { value: 10 },
				uRotationProgress: { value: 0 }
			}
		})
	}
}