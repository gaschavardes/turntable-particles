import { RawShaderMaterial } from 'three'

import vertexShader from './vert.glsl'
import fragmentShader from './frag.glsl'
export default class StarsMaterial extends RawShaderMaterial {
	constructor(options) {
		console.log(options.uTextureSize)
		super({
			vertexShader,
			fragmentShader,
			depthWrite: false,
			depthTest: false,
			transparent: true,
			opacity: 0.1,
			uniforms: {
				// uTime: store.WebGL.globalUniforms.uTime,
				uSize: { value: 10 },
				displaceText: { value: options.displaceText },
				uTextureSize: { value: options.uTextureSize },
				uTime: { value: 0 },
				boneTextureSize: { value: options.boneTextureSize },
				uTexture: { value: options.uTexture },
				bindMatrix: { value: options.bindMatrix },
				bindMatrixInverse: { value: options.bindMatrixInverse },
				uJointTexture: { value: options.u_jointTexture }
			}
		})
	}
}