import { Color, MathUtils, Vector3, Layers, Euler, MeshBasicMaterial, BufferAttribute, ShaderMaterial, Quaternion, Points, AnimationMixer, AnimationClip, MeshNormalMaterial, Texture, Scene, TorusKnotGeometry, BufferGeometry, InstancedBufferAttribute, UnsignedByteType, Matrix4, InstancedMesh, Object3D, Vector2, RGBAFormat, FloatType, DataTexture, NearestFilter, Mesh } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js'
import { EyesMaterial, StarsMaterial } from '../materials'
import WaterTexture from '../components/WaterTexture'
import store from '../store'
import { E } from '../utils'
import GlobalEvents from '../utils/GlobalEvents'
import gsap from 'gsap'
import { Gui } from '../utils/Gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import screenFxVert from '../../glsl/includes/screenFx/vert.glsl'
import screenFxFrag from '../../glsl/includes/screenFx/frag.glsl'
import finalFxVert from '../../glsl/includes/finalPass/vert.glsl'
import finalFxFrag from '../../glsl/includes/finalPass/frag.glsl'
const _offsetMatrix = /* @__PURE__ */ new Matrix4()
const _identityMatrix = /* @__PURE__ */ new Matrix4()

const ENTIRE_SCENE = 0; const BLOOM_SCENE = 12
export default class MainScene extends Scene {
	constructor() {
		super()
		this.gltfLoader = new GLTFLoader()
		this.load()
		this.count = 1500
		this.size = 0.05
		this.spread = 15
		this.radius = 1
		this.spin = 1
		this.branches = 2
		this.randomValue = 1
		this.hole = 2
		this.randomArray = []
		this.randomArrayParticles = []
		this.angleArray = []
		this.posArray = []
		this.dampedProgress = 0
		this.dampedProgressCamera = 0
		this.rotationProgress = 0
		this.dampedRotationProgress = 0
		this.originalMatrix = []
		this.randomVal = []
		this.animationsProgress = []
		this.materials = {}
		this.color1 = '#ff1400'
		this.color2 = '#0044ff'
		this.dummy = new Object3D()
		this.targetAcceleration = new Vector3()
		this.composer = new EffectComposer(store.WebGL.renderer)
		this.composer.setSize(store.window.w, store.window.h)
		this.darkMaterial = new MeshBasicMaterial({ color: 'black' })
		this.bloomLayer = new Layers()
		this.bloomLayer.set(BLOOM_SCENE)
		E.on('App:start', () => {
			this.build()
			this.buildPasses()
			this.addEvents()
			store.Gui = new Gui()

			// const afterimagePass = new AfterimagePass()
			// afterimagePass.uniforms.damp.value = 0
			// // afterimagePass.renderToScreen = false
			// store.WebGL.composerPasses.add(afterimagePass, 3)
		})
		// this.controls = new OrbitControls(store.camera, store.WebGL.renderer.domElement)
		// this.controls.enableDamping = true
	}

	build() {
		this.traverse(this.disposeMaterial)
		this.waterTexture = new WaterTexture({ debug: true })
		this.buildInstance()
		this.createRotatedMatrix()
		this.setTimeline()
		this.setBlinkingAnim(39)
		this.setSurprise()
		this.setParticles()
	}

	disposeMaterial(obj) {
		if (obj.material) {
			obj.material.dispose()
		}
	}

	buildPasses() {
		this.renderScene = new RenderPass(this, store.camera)

		this.fxaaPass = new ShaderPass(FXAAShader)
		this.fxaaPass.material.uniforms.resolution.value.x = 1 / (store.window.w * store.WebGL.renderer.getPixelRatio())
		this.fxaaPass.material.uniforms.resolution.value.y = 1 / (store.window.fullHeight * store.WebGL.renderer.getPixelRatio())

		this.bloomPass = new UnrealBloomPass(new Vector2(store.window.w, store.window.fullHeight), 2.120, 1, 0.6)
		this.bloomPass.enabled = true

		this.screenFxPass = new ShaderPass(new ShaderMaterial({
			vertexShader: screenFxVert,
			fragmentShader: screenFxFrag,
			uniforms: {
				tDiffuse: { value: null },
				uMaxDistort: { value: 0.251 },
				uBendAmount: { value: -0.272 }
			}
		}))

		this.composer.addPass(this.renderScene)
		this.composer.renderToScreen = false
		this.composer.addPass(this.fxaaPass)
		this.composer.addPass(this.bloomPass)
		this.composer.addPass(this.screenFxPass)

		const finalPass = new ShaderPass(
			new ShaderMaterial({
				uniforms: {
					baseTexture: { value: null },
					bloomTexture: { value: this.composer.renderTarget2.texture }
				},
				vertexShader: finalFxVert,
				fragmentShader: finalFxFrag,
				defines: {}
			}), 'baseTexture'
		)
		finalPass.needsSwap = true

		this.finalComposer = new EffectComposer(store.WebGL.renderer)
		this.finalComposer.setSize(store.window.w, store.window.h)
		this.finalComposer.addPass(this.renderScene)
		this.finalComposer.addPass(finalPass)
	}

	setTimeline() {
		// this.tl = gsap.timeline()
		// this.tl.to(this, { hole: 1., randomVal: 1 }, 0)
	}

	buildInstance() {
		const matrix = new Matrix4()

		// SUZANNE TEST
		this.suzanne = this.assets.models.suzanne.scene.children[0]
		this.suzanneSphere = this.assets.models.suzanneSphere.scene.children[0]
		// this.getPositionAttribute(this.suzanneSphere.geometry)

		const rotateMatrix = new Float32Array(16)
		const rotateTexture = new DataTexture(rotateMatrix, this.size, this.size, RGBAFormat, FloatType)
		rotateTexture.needsUpdate = true

		this.eyesMaterial = new EyesMaterial({
			displaceText: this.waterTexture.texture,
			uTextureSize: new Vector2(this.spread, this.spread),
			uTexture: this.assets.textures.whale,
			uMouse: new Vector2(0, 0),
			uRotateState: new Matrix4(),
			uAcceleration: new Vector3(),
			uTime: 0,
			rotationProgress: 0,
			isDark: false
		})
		// this.eyesMaterial = new MeshNormalMaterial()
		const offset = []
		const rotateState = []
		this.radiusVal = []
		this.instanceMesh = new InstancedMesh(this.suzanne.geometry, this.eyesMaterial, this.count)
		this.instanceMesh.layers.enable(BLOOM_SCENE)
		for (let i = 0; i < this.count; i++) {
			// PUT THEM IN GRID
			const space = 2
			const x = (i % this.spread) * space - (this.spread * 0.5 * space)
			const y = Math.round(i / this.spread) * space - (Math.round(this.count / this.spread) * space * 0.5)
			const z = 0
			/// /
			this.randomizeMatrix(i, matrix, x, y, z)

			offset.push(x)
			offset.push(y)
			offset.push(z)

			this.originalMatrix.push(matrix.clone())
			this.randomVal.push(Math.random() * 1 + 0.8)
			this.animationsProgress.push(0)
			rotateState.push(...rotateMatrix)
			this.instanceMesh.setMatrixAt(i, matrix)
			this.radiusVal.push(0)
		}
		const randomArray = new Float32Array(this.randomVal)
		const animationProgress = new Float32Array(this.animationsProgress)
		const rotatePosMatrix = new Float32Array(rotateState)
		const radiusVal = new Float32Array(this.radiusVal)
		this.instanceMesh.geometry.setAttribute('randomVal', new InstancedBufferAttribute(randomArray, 1))
		this.instanceMesh.geometry.setAttribute('animationProgress', new InstancedBufferAttribute(animationProgress, 1))
		this.instanceMesh.geometry.setAttribute('radiusVal', new InstancedBufferAttribute(radiusVal, 1))
		this.instanceMesh.geometry.setAttribute('rotatePos', new InstancedBufferAttribute(rotatePosMatrix, 16))
		this.instanceMesh.geometry.attributes.animationProgress.needsUpdate = true
		this.instanceMesh.geometry.setAttribute('spherePosition', this.suzanneSphere.geometry.attributes.position)
		this.add(this.instanceMesh)
		// this.updateAnim(0)
	}

	setSurprise() {
		const geometry = new TorusKnotGeometry(1, 0.3, 100, 16)
		const material = new MeshNormalMaterial()
		this.present = new Mesh(geometry, material)
		this.add(this.present)
	}

	setParticles() {
		const geometry = new BufferGeometry()
		const positions = new Float32Array(this.count * 3)
		this.colors = new Float32Array(this.count * 3)
		const rotateState = []
		const rotateMatrix = new Float32Array(16)
		for (let i = 0; i < this.count; i++) {
			const i3 = i * 3

			this.randomArrayParticles.push(
				{
					random1: Math.random(),
					randomX: Math.random(),
					randomY: Math.random()
				}
			)
			positions[i3] = Math.random() * 20 - 10
			positions[i3 + 1] = Math.random() * 20 - 10
			positions[i3 + 2] = Math.random() * 20 - 10

			rotateState.push(...rotateMatrix)
		}

		const rotatePosMatrix = new Float32Array(rotateState)
		geometry.setAttribute('position', new BufferAttribute(positions, 3))
		geometry.setAttribute('color', new BufferAttribute(this.colors, 3))
		geometry.setAttribute('rotatePos', new BufferAttribute(rotatePosMatrix, 16))

		this.points = new Points(geometry, new StarsMaterial({
			uRotationProgress: 0
		})
		)
		this.add(this.points)
	}

	randomizeMatrix(i, matrix, x, y, z) {
		const position = new Vector3()
		const rotation = new Euler()
		const quaternion = new Quaternion()
		const scale = new Vector3()
		const radius = 2.5 + Math.random() * 0.5
		// const angle = Math.random() * Math.PI * 2 - Math.PI

		// const theta = MathUtils.randFloatSpread(360)
		const phi = MathUtils.randFloatSpread(360)

		const theta = (i / this.count) * 360
		// const phi = ((this.count - i) / this.count) * 360

		// this.angleArray.push({ 'x': phi, 'y': theta })
		position.x = radius * Math.sin(theta) * Math.cos(phi)
		position.y = radius * Math.sin(theta) * Math.sin(phi)
		position.z = radius * Math.cos(theta)
		this.angleArray.push({ 'x': position.x, 'y': position.y })
		rotation.x = Math.random() * 2 * Math.PI
		rotation.y = Math.random() * 2 * Math.PI
		rotation.z = Math.random() * 2 * Math.PI
		rotation.x = 0
		rotation.y = 0
		rotation.z = 0

		quaternion.setFromEuler(rotation)

		scale.x = scale.y = scale.z = 0.2
		this.posArray.push(position)
		matrix.compose(position, quaternion, scale)
		return matrix
	}

	addEvents() {
		E.on(GlobalEvents.RESIZE, this.onResize)
		store.RAFCollection.add(this.onRaf, 3)
	}

	clamp(num, min, max) {
		return Math.min(Math.max(num, min), max)
	}

	onRaf = (time) => {
		this.waterTexture.update()
		// this.controls.update()
		this.time = time
		// this.touchTexture.update()
		// const positions = this.points.geometry.attributes.position.array
		// store.progress += 0.001
		this.dampedProgress += (store.progress - this.dampedProgress) * 0.1
		this.dampedRotationProgress += (store.progress - this.dampedRotationProgress) * 0.05
		this.dampedProgressCamera += (store.progress - this.dampedProgress) * 0.15
		this.radius = 60 + this.dampedProgress * 1

		this.present.rotation.y = this.dampedProgressCamera
		// store.progress += 0.02
		// console.log(this.dampedProgressCamera)

		this.rotationProgress = store.progress - this.dampedRotationProgress
		if (store.acceleration) {
			let tmp = new Vector3()

			const actualAcc = new Vector3(store.acceleration.x, store.acceleration.y, store.acceleration.z)
			// console.log(Math.round(store.acceleration.x))
			actualAcc.multiplyScalar(5)
			tmp = actualAcc.sub(this.targetAcceleration)
			tmp.multiplyScalar(0.1)
			this.targetAcceleration.add(tmp)

			this.instanceMesh.material.uniforms.uAcceleration.value = this.targetAcceleration
			this.instanceMesh.material.uniforms.uRotationProgress.value = this.rotationProgress
			this.points.material.uniforms.uRotationProgress.value = this.rotationProgress
		}

		this.instanceMesh.instanceMatrix.needsUpdate = true
		// this.instanceMesh.material.uniforms.uTime.value = time
		// store.camera.rotation.set(0, 0, 0)

		if (store.acceleration) {
			store.camera.rotation.set(0, 0, this.dampedProgressCamera * 1.5)
		}

		/// PARTICLES MOVEMENT

		this.createRotatedMatrix1()
		this.renderBloom(true)
		this.finalComposer.render()

		// this.composer.render()
	}

	renderBloom = (mask) => {
		if (mask === true) {
			this.traverse(this.darkenNonBloomed)
			this.composer.render()
			this.traverse(this.restoreMaterial)
		} else {
			store.camera.layers.set(BLOOM_SCENE)
			this.composer.render()
			store.camera.layers.set(ENTIRE_SCENE)
		}
	}

	darkenNonBloomed = (obj) => {
		if (obj.isMesh && this.bloomLayer.test(obj.layers) === true) {
			this.materials[obj.uuid] = obj.material
			obj.material.uniforms.isDark.value = 1 - this.rotationProgress
		}
	}

	restoreMaterial = (obj) => {
		if (this.materials[obj.uuid]) {
			obj.material.uniforms.isDark.value = 0
			delete this.materials[obj.uuid]
		}
	}

	onResize = () => {
		store.camera.aspect = store.window.w / store.window.h
		store.camera.updateProjectionMatrix()
	}

	load() {
		this.assets = {
			textures: {},
			models: {},
			anim: {}
		}
		const fbx = {
			// catcher: 'Ch43_nonPBR.fbx'
		}
		const glb = {
			suzanne: 'suzanne.glb',
			suzanneSphere: 'suzanneSphere.glb'
		}

		const texture = {

		}

		for (const key in glb) {
			store.AssetLoader.loadGltf((`models/${glb[key]}`)).then((gltf, animation) => {
				this.assets.models[key] = gltf
				if (gltf.parser.json.buffers[0].uri) {
					this.loadBinary(gltf.parser.json.buffers[0].uri)
				}
			})
		}
		for (const key in texture) {
			store.AssetLoader.loadTexture((`texture/${texture[key]}`)).then(texture => {
				this.assets.textures[key] = texture
			})
		}
	}

	loadBinary(url) {
		this.loadFile(url, 'arrayBuffer')
	}

	loadFile(url, typeFunc) {
		this.promise = new Promise((resolve, reject) => {
			fetch(url)
				.then(response => {
					if (!response.ok) {
						throw new Error('Network response was not ok for request: ', url)
					}
					resolve(response)
				}, reject)
		})
	}

	decodeBase64(base64) {
		const data = base64.replace('data:application/octet-stream;base64,', '')
		const binaryString = atob(data)
		const arrayBuffer = new ArrayBuffer(binaryString.length)
		const view = new Uint8Array(arrayBuffer)
		for (let i = 0; i < binaryString.length; i++) {
			view[i] = binaryString.charCodeAt(i)
		}
		return arrayBuffer
	}

	createRotatedMatrix() {
		this.tempMatrix = []
		for (let id = 0; id < this.count; id++) {
			const position = new Vector3()
			const quaternion = new Quaternion()
			const scale = new Vector3()
			const matrix = new Matrix4()
			// const radius = (id % 3 + 1) + 0.5
			// // position.x = radius * Math.cos(this.angleArray[id].phi)
			// // position.y = radius * Math.sin(this.angleArray[id].phi)
			// const angle = Math.atan(this.angleArray[id].y / this.angleArray[id].x)
			// position.x = Math.sign(this.angleArray[id].x) * radius * Math.cos(angle) + Math.random() * 0.2 - 0.1
			// position.y = Math.sign(this.angleArray[id].x) * radius * Math.sin(angle) + Math.random() * 0.2 - 0.1
			// // position.z = this.posArray[id].z
			// position.z = angle * 5

			this.branches = 10
			this.randomArray.push(
				{
					random1: Math.random(),
					randomX: Math.random(),
					randomY: Math.random()
				}
			)
			const radius = Math.random() * this.radius
			const randomise = (Math.random() - 0.5) * this.randomValue
			const spin = radius * this.spin
			const branchAngle = (id % this.branches) / this.branches * Math.PI * 2

			position.x = Math.cos(branchAngle + spin) * (radius + this.hole) + (randomise * radius)
			position.y = Math.sin(branchAngle + spin) * (radius + this.hole) + (randomise * radius)
			position.z = (Math.log(radius + this.hole) - this.radius) * 10 + 3

			quaternion.w = 0
			quaternion.x = 0
			quaternion.y = 0
			quaternion.z = 0

			scale.x = 1
			scale.y = 1
			scale.z = 1
			matrix.compose(position, quaternion, scale)
			this.tempMatrix.push(...matrix.elements)
		}
		const rotatePosMatrix = new Float32Array(this.tempMatrix)
		this.instanceMesh.geometry.attributes.rotatePos.set(rotatePosMatrix)
		this.instanceMesh.geometry.attributes.rotatePos.needsUpdate = true
	}

	createRotatedMatrix1() {
		this.tempMatrix = []
		this.radiusVal = []
		for (let id = 0; id < this.count; id++) {
			const position = new Vector3()
			const quaternion = new Quaternion()
			const scale = new Vector3()
			const matrix = new Matrix4()

			this.branches = 5
			this.radius = 60 + this.time * 1
			const radius = ((this.randomArray[id].random1 + 0.1) * this.radius) % 5
			this.radiusVal.push(radius)
			let randomiseX = (this.randomArray[id].randomX - 0.5) * this.randomValue
			let randomiseY = (this.randomArray[id].randomY - 0.5) * this.randomValue
			randomiseX = (this.randomArray[id].randomX) * (id % 2 - 0.5) * this.randomValue
			randomiseY = (this.randomArray[id].randomY) * (id % 2 - 0.5) * this.randomValue
			const spin = radius * this.spin
			const branchAngle = (id % this.branches) / this.branches * Math.PI * 2

			position.x = Math.cos(branchAngle + spin) * (radius + this.hole) + (randomiseX * (radius + 0.3))
			position.y = Math.sin(branchAngle + spin) * (radius + this.hole) + (randomiseY * (radius + 0.3))
			position.z = ((Math.log(radius + this.hole)) * 10) * this.clamp(this.time, 0, 1) - 5
			quaternion.w = 0
			quaternion.x = 0
			quaternion.y = 0
			quaternion.z = 0

			scale.x = 1
			scale.y = 1
			scale.z = 1
			matrix.compose(position, quaternion, scale)
			this.tempMatrix.push(...matrix.elements)
		}
		const rotatePosMatrix = new Float32Array(this.tempMatrix)
		this.instanceMesh.geometry.attributes.rotatePos.set(rotatePosMatrix)
		this.instanceMesh.geometry.attributes.rotatePos.needsUpdate = true

		this.instanceMesh.geometry.attributes.radiusVal.set(this.radiusVal)
		this.instanceMesh.geometry.attributes.radiusVal.needsUpdate = true
	}

	setBlinkingAnim(id) {
		this.blinkValue = 0
		gsap.to(this, {
			blinkValue: Math.PI,
			// yoyo: true,
			onUpdate: () => {
				this.instanceMesh.geometry.attributes.animationProgress.array.forEach((el, i) => {
					if (i % id === 0) {
						this.instanceMesh.geometry.attributes.animationProgress.setX(i, Math.sin(this.blinkValue))
					}
				})
				this.instanceMesh.geometry.attributes.animationProgress.needsUpdate = true
			},
			onComplete: () => {
				this.setBlinkingAnim(Math.round(Math.random() * 50 + 50))
			}
		})
	}

	calculateInverses() {
		this.boneInverses.length = 0

		for (let i = 0, il = this.bones.length; i < il; i++) {
			const inverse = new Matrix4()

			if (this.bones[i]) {
				inverse.copy(this.bones[i].matrixWorld).invert()
			}

			this.boneInverses.push(inverse)
		}
	}
}