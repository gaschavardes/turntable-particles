import { ShaderChunk } from 'three'
import { glslifyStrip } from '../utils'
import defaultVert from '../../glsl/includes/default/vert.glsl'
import defaultFrag from '../../glsl/includes/default/frag.glsl'
import normalsVert from '../../glsl/includes/normals/vert.glsl'

import BasicMaterial from './basic/BasicMaterial'
import EyesMaterial from './eyes/EyesMaterial'
import StarsMaterial from './stars/StarsMaterial'
import TestMaterial from './test/TestMaterial'

// Shader #include chunks
ShaderChunk.defaultVert = glslifyStrip(defaultVert)
ShaderChunk.defaultFrag = glslifyStrip(defaultFrag)
ShaderChunk.normalsVert = glslifyStrip(normalsVert)

export {
	BasicMaterial, TestMaterial, EyesMaterial, StarsMaterial
}