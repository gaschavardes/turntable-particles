import { Color, MathUtils, Vector3, Euler, Quaternion, AnimationMixer, AnimationClip, MeshNormalMaterial, Texture, Scene, TorusKnotBufferGeometry, BufferGeometry, InstancedBufferAttribute, UnsignedByteType, Matrix4, InstancedMesh, Object3D, Vector2, RGBAFormat, FloatType, DataTexture, NearestFilter } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js'
import { StarsMaterial } from '../materials'
import WaterTexture from '../components/WaterTexture'
import store from '../store'
import { E } from '../utils'
import GlobalEvents from '../utils/GlobalEvents'
import gsap from 'gsap'
import { Gui } from '../utils/Gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
const _offsetMatrix = /* @__PURE__ */ new Matrix4()
const _identityMatrix = /* @__PURE__ */ new Matrix4()
export default class MainScene extends Scene {
	constructor() {
		super()
		this.gltfLoader = new GLTFLoader()
		this.load()
		this.count = 5000
		this.size = 0.05
		this.spread = 15
		this.radius = 5
		this.spin = 1
		this.branches = 20
		this.randomVal = 10
		this.hole = 0
		this.randomArray = []
		this.angleArray = []
		this.posArray = []
		this.dampedProgress = 0
		this.dampedProgressCamera = 0
		this.originalMatrix = []
		this.randomVal = []
		this.animationsProgress = []
		this.color1 = '#ff1400'
		this.color2 = '#0044ff'
		this.dummy = new Object3D()
		this.targetAcceleration = new Vector3()
		E.on('App:start', () => {
			this.build()
			this.addEvents()
			store.Gui = new Gui()

			this.renderPass = new RenderPass(this, store.camera)
			// this.renderPass.clear = false
			// this.renderPass.clearDepth = false
			this.renderPass.enabled = true
			store.WebGL.composerPasses.add(this.renderPass, 1)

			// const afterimagePass = new AfterimagePass()
			// afterimagePass.uniforms.damp.value = 0
			// // afterimagePass.renderToScreen = false
			// store.WebGL.composerPasses.add(afterimagePass, 3)
		})
		this.controls = new OrbitControls(store.camera, store.WebGL.renderer.domElement)
		this.controls.enableDamping = true
	}

	build() {
		this.waterTexture = new WaterTexture({ debug: true })
		this.buildInstance()
		this.createRotatedMatrix()
		this.setTimeline()
		this.setBlinkingAnim(39)
	}

	setTimeline() {
		// this.tl = gsap.timeline()
		// this.tl.to(this, { hole: 1., randomVal: 1 }, 0)
	}

	buildInstance() {
		const matrix = new Matrix4()
		this.bones = []
		this.boneInverses = []
		Array.from(this.assets.models.whale.parser.associations).forEach(el => {
			if (el[0].type === 'SkinnedMesh') {
				this.mesh = el[0]
			} else if (el[0].type === 'Bone') {
				this.bones.push(el[0])
			}
		})

		this.mixer = new AnimationMixer(this.assets.models.whale.scene)
		this.clips = this.assets.models.whale.animations
		const clip = AnimationClip.findByName(this.clips, 'swim')
		this.mixer.clipAction(clip).play()
		this.calculateInverses()
		this.mesh.skin = this.assets.models.whale.parser.json.skins[0]
		this.mesh.accessors = this.assets.models.whale.parser.json.accessors
		this.mesh.json = this.assets.models.whale.parser.json

		// SUZANNE TEST

		this.suzanne = this.assets.models.suzanne.scene.children[0]
		this.suzanneSphere = this.assets.models.suzanneSphere.scene.children[0]
		// this.getPositionAttribute(this.suzanneSphere.geometry)

		const rotateMatrix = new Float32Array(16)
		const rotateTexture = new DataTexture(rotateMatrix, this.size, this.size, RGBAFormat, FloatType)
		rotateTexture.needsUpdate = true

		this.computeBoneTexture()
		const geometry = this.mesh.geometry
		this.material = new StarsMaterial({
			displaceText: this.waterTexture.texture,
			uTextureSize: new Vector2(this.spread, this.spread),
			uTexture: this.assets.textures.whale,
			uMouse: new Vector2(0, 0),
			bindMatrix: this.mesh.bindMatrix,
			bindMatrixInverse: this.mesh.bindMatrixInverse,
			boneTextureSize: this.boneTextureSize,
			u_jointTexture: this.boneTexture,
			uRotateState: new Matrix4(),
			uAcceleration: new Vector3(),
			uTime: 0
		})
		const offset = []
		const rotateState = []
		this.instanceMesh = new InstancedMesh(this.suzanne.geometry, this.material, this.count)
		console.log(this.instanceMesh, new Matrix4())
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
			this.randomVal.push(Math.random() * 1 - 0.5 + 0.1)
			this.animationsProgress.push(0)
			rotateState.push(...rotateMatrix)
			this.instanceMesh.setMatrixAt(i, matrix)
		}
		const randomArray = new Float32Array(this.randomVal)
		const animationProgress = new Float32Array(this.animationsProgress)
		const rotatePosMatrix = new Float32Array(rotateState)
		this.instanceMesh.geometry.setAttribute('randomVal', new InstancedBufferAttribute(randomArray, 1))
		this.instanceMesh.geometry.setAttribute('animationProgress', new InstancedBufferAttribute(animationProgress, 1))
		console.log(rotateState)
		this.instanceMesh.geometry.setAttribute('rotatePos', new InstancedBufferAttribute(rotatePosMatrix, 16))
		this.instanceMesh.geometry.attributes.animationProgress.needsUpdate = true
		this.instanceMesh.geometry.setAttribute('spherePosition', this.suzanneSphere.geometry.attributes.position)
		this.add(this.instanceMesh)
		// this.updateAnim(0)
	}

	randomizeMatrix(i, matrix, x, y, z) {
		const position = new Vector3()
		const rotation = new Euler()
		const quaternion = new Quaternion()
		const scale = new Vector3()
		const radius = Math.random() * 2
		// const angle = Math.random() * Math.PI * 2 - Math.PI

		const theta = MathUtils.randFloatSpread(360)
		const phi = MathUtils.randFloatSpread(360)
		this.angleArray.push({ 'phi': phi, 'theta': theta })
		position.x = radius * Math.sin(theta) * Math.cos(phi)
		position.y = radius * Math.sin(theta) * Math.sin(phi)
		position.z = radius * Math.cos(theta)

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
		// this.touchTexture.update()
		// const positions = this.points.geometry.attributes.position.array
		// store.progress += 0.001
		this.dampedProgress += (store.progress - this.dampedProgress) * 0.1
		this.dampedProgressCamera += (store.progress - this.dampedProgress) * 0.15
		this.radius = 60 + this.dampedProgress * 1
		// store.progress += 0.02
		// console.log(this.dampedProgressCamera)

		if (store.acceleration) {
			let tmp = new Vector3()

			const actualAcc = new Vector3(store.acceleration.x, store.acceleration.y, store.acceleration.z)
			actualAcc.multiplyScalar(5)
			tmp = actualAcc.sub(this.targetAcceleration)
			tmp.multiplyScalar(0.1)
			this.targetAcceleration.add(tmp)

			this.instanceMesh.material.uniforms.uAcceleration.value = this.targetAcceleration
		}

		if (!store.motion) {
			// for (let i = 0; i < this.count; i++) {
			// 	this.originalMatrix[i].decompose(this.dummy.position, this.dummy.rotation, this.dummy.scale)
			// 	this.dummy.position.x += Math.sin(time) * this.randomVal[i]
			// 	this.dummy.position.y += Math.sin(time) * this.randomVal[i]
			// 	this.dummy.position.z += Math.sin(time) * this.randomVal[i]
			// 	this.dummy.updateMatrix()
			// 	this.instanceMesh.setMatrixAt(i, this.dummy.matrix)
			// 	// this.instanceMesh.getMatrixAt(i, matrix)
			// }
		} else {
			// for (let i = 0; i < this.count; i++) {
			// 	this.originalMatrix[i].decompose(this.dummy.position, this.dummy.rotation, this.dummy.scale)
			// 	this.dummy.position.x += store.acceleration.x * 0.1 * this.randomVal[i]
			// 	this.dummy.position.y += store.acceleration.y * 0.1 * this.randomVal[i]
			// 	this.dummy.position.z += store.acceleration.z * 0.1 * this.randomVal[i]
			// 	console.log(store.acceleration.x)
			// 	this.dummy.updateMatrix()
			// 	this.instanceMesh.setMatrixAt(i, this.dummy.matrix)
			// 	this.instanceMesh.getMatrixAt(i, matrix)
			// }
		}

		this.instanceMesh.instanceMatrix.needsUpdate = true
		this.instanceMesh.material.uniforms.uTime.value = time
		// store.camera.rotation.set(0, 0, 0)

		const bones = this.bones
		const boneInverses = this.boneInverses
		const boneMatrices = this.boneMatrices
		const boneTexture = this.boneTexture

		// flatten bone matrices to array

		for (let i = 0, il = bones.length; i < il; i++) {
			// compute the offset between the current and the original transform

			const matrix = bones[i] ? bones[i].matrixWorld : _identityMatrix
			_offsetMatrix.multiplyMatrices(matrix, boneInverses[i])
			_offsetMatrix.toArray(boneMatrices, i * 16)
		}

		if (boneTexture !== null) {
			boneTexture.needsUpdate = true
		}

		store.camera.rotation.set(0, 0, this.dampedProgressCamera * 1.5)
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
			catcherGlb: 'catch.glb',
			whale: 'whale1.gltf',
			suzanne: 'suzanne.glb',
			suzanneSphere: 'suzanneSphere.glb'
		}
		const anim = {
			groin: 'groin_anim.fbx'
		}
		const texture = {
			whale: 'whale.png'
		}

		for (const key in fbx) {
			store.AssetLoader.loadFbx((`public/models/${fbx[key]}`)).then(fbx => {
				this.assets.models[key] = fbx
			})
		}

		for (const key in anim) {
			store.AssetLoader.loadFbx((`public/models/${anim[key]}`)).then(fbx => {
				this.assets.models[key] = fbx
			})
		}
		for (const key in glb) {
			store.AssetLoader.loadGltf((`public/models/${glb[key]}`)).then((gltf, animation) => {
				console.log(key, gltf)
				this.assets.models[key] = gltf
				if (gltf.parser.json.buffers[0].uri) {
					this.loadBinary(gltf.parser.json.buffers[0].uri)
				}
			})
		}
		for (const key in texture) {
			store.AssetLoader.loadTexture((`public/texture/${texture[key]}`)).then(texture => {
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

	computeBoneTexture() {
		this.boneMatrices = new Float32Array(this.bones.length * 16)
		// layout (1 matrix = 4 pixels)
		//      RGBA RGBA RGBA RGBA (=> column1, column2, column3, column4)
		//  with  8x8  pixel texture max   16 bones * 4 pixels =  (8 * 8)
		//       16x16 pixel texture max   64 bones * 4 pixels = (16 * 16)
		//       32x32 pixel texture max  256 bones * 4 pixels = (32 * 32)
		//       64x64 pixel texture max 1024 bones * 4 pixels = (64 * 64)

		let size = Math.sqrt(this.bones.length * 4) // 4 pixels needed for 1 matrix
		size = MathUtils.ceilPowerOfTwo(size)
		size = Math.max(size, 4)
		this.size = size
		const boneMatrices = new Float32Array(size * size * 4) // 4 floats per RGBA pixel
		boneMatrices.set(this.boneMatrices) // copy current values
		const boneTexture = new DataTexture(boneMatrices, size, size, RGBAFormat, FloatType)
		boneTexture.needsUpdate = true

		this.boneMatrices = boneMatrices
		this.boneTexture = boneTexture
		this.boneTextureSize = size

		return this
	}

	updateAnim(id) {
		const animation = this.assets.models.whale.animations[1]
		this.tempMatrix = []
		this.bones.forEach((el, i) => {
			const position = new Vector3()
			const quaternion = new Quaternion()
			const scale = new Vector3()
			const matrix = new Matrix4()
			position.x = animation.tracks[i * 3].values[id]
			position.y = animation.tracks[i * 3].values[id + 1]
			position.z = animation.tracks[i * 3].values[id + 2]
			if (animation.tracks[(i + 1) * 3]) {
				quaternion.w = animation.tracks[(i + 1) * 3].values[id]
				quaternion.x = animation.tracks[(i + 1) * 3].values[id + 1]
				quaternion.y = animation.tracks[(i + 1) * 3].values[id + 2]
				quaternion.z = animation.tracks[(i + 1) * 3].values[id + 3]
			}
			if (animation.tracks[(i + 2) * 3]) {
				scale.x = animation.tracks[(i + 2) * 3].values[id]
				scale.y = animation.tracks[(i + 2) * 3].values[id + 1]
				scale.z = animation.tracks[(i + 2) * 3].values[id + 2]
			}
			matrix.compose(position, quaternion, scale)
			this.tempMatrix.push(...matrix.elements)
		})
		const boneMatrices = new Float32Array(this.size * this.size * 4)
		boneMatrices.set(this.tempMatrix)
		const boneTexture = new DataTexture(boneMatrices, this.size, this.size, RGBAFormat, FloatType)
		boneTexture.needsUpdate = true
	}

	createRotatedMatrix() {
		this.tempMatrix = []
		for (let id = 0; id < this.count; id++) {
			const position = new Vector3()
			const quaternion = new Quaternion()
			const scale = new Vector3()
			const matrix = new Matrix4()

			const radius = (id % 3 + 1) + 0.5
			position.x = radius * Math.cos(this.angleArray[id].phi)
			position.y = radius * Math.sin(this.angleArray[id].phi)
			position.z = this.posArray[id].z

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
		console.log(rotatePosMatrix)
		this.instanceMesh.geometry.attributes.rotatePos.set(rotatePosMatrix)
		this.instanceMesh.geometry.attributes.rotatePos.needsUpdate = true
		console.log(this.instanceMesh.geometry.attributes.rotatePos)
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