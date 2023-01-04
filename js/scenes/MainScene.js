import { Color, Vector3, Euler, Quaternion, MeshNormalMaterial, Scene, TorusKnotBufferGeometry, BufferGeometry, InstancedBufferAttribute, Points, Matrix4, InstancedMesh, Object3D, Vector2 } from 'three'
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

export default class MainScene extends Scene {
	constructor() {
		super()

		this.load()
		this.count = 3000
		this.size = 0.05
		this.spread = 30
		this.radius = 5
		this.spin = 1
		this.branches = 20
		this.randomVal = 10
		this.hole = 0
		this.randomArray = []
		this.dampedProgress = 0
		this.dampedProgressCamera = 0
		this.originalMatrix = []
		this.randomVal = []
		this.color1 = '#ff1400'
		this.color2 = '#0044ff'
		this.dummy = new Object3D()

		E.on('App:start', () => {
			this.build()
			this.addEvents()
			store.Gui = new Gui()

			this.renderPass = new RenderPass(this, store.camera)
			// this.renderPass.clear = false
			// this.renderPass.clearDepth = false
			this.renderPass.enabled = true
			store.WebGL.composerPasses.add(this.renderPass, 1)

			const afterimagePass = new AfterimagePass()
			afterimagePass.uniforms.damp.value = 0
			// afterimagePass.renderToScreen = false
			store.WebGL.composerPasses.add(afterimagePass, 3)
		})
	}

	build() {
		this.waterTexture = new WaterTexture({ debug: true })
		this.buildInstance()
		this.setTimeline()
	}

	setTimeline() {
		// this.tl = gsap.timeline()
		// this.tl.to(this, { hole: 1., randomVal: 1 }, 0)
	}

	// buildGalaxy() {
	// 	const geometry = new BufferGeometry()
	// 	const positions = new Float32Array(this.count * 3)
	// 	this.colors = new Float32Array(this.count * 3)
	// 	for (let i = 0; i < this.count; i++) {
	// 		const i3 = i * 3

	// 		this.randomArray.push(
	// 			{
	// 				random1: Math.random(),
	// 				randomX: Math.random(),
	// 				randomY: Math.random()
	// 			}
	// 		)

	// 		const radius = Math.random() * this.radius
	// 		const randomise = (Math.random() - 0.5) * this.randomVal
	// 		const branchAngle = (i % this.branches) / this.branches * Math.PI * 2

	// 		positions[i3] = (this.randomArray[i].randomX) * (i % 2 - 0.5) * this.randomVal
	// 		positions[i3 + 1] = (this.randomArray[i].randomY) * ((i + 1) % 3 - 0.5) * this.randomVal
	// 		positions[i3 + 2] = (Math.log(radius + this.hole) - this.radius) * 1 + 3
	// 	}

	// 	geometry.setAttribute('position', new BufferAttribute(positions, 3))
	// 	geometry.setAttribute('color', new BufferAttribute(this.colors, 3))

	// 	this.points = new Points(geometry, new StarsMaterial())
	// 	this.add(this.points)
	// }

	buildInstance() {
		const matrix = new Matrix4()
		const geometry = new TorusKnotBufferGeometry()
		this.material = new StarsMaterial({
			displaceText: this.waterTexture.texture,
			uTextureSize: new Vector2(this.spread, this.spread),
			uMouse: new Vector2(0, 0),
			uTime: 0
		})
		const offset = []
		this.instanceMesh = new InstancedMesh(geometry, this.material, this.count)
		for (let i = 0; i < this.count; i++) {
			const x = Math.random() * this.spread - this.spread * 0.5
			const y = Math.random() * this.spread - this.spread * 0.5
			const z = 0
			// const x = (i % this.spread) * 0.5 - (this.spread * 0.25)
			// const y = Math.round(i / this.spread) * 0.5 - (Math.round(this.count / this.spread) * 0.5 * 0.5)
			// const z = 0
			this.randomizeMatrix(matrix, x, y, z)

			offset.push(x)
			offset.push(y)
			offset.push(z)

			this.originalMatrix.push(matrix.clone())
			this.randomVal.push(Math.random() * 20 + 10)
			this.instanceMesh.setMatrixAt(i, matrix)
		}
		const offsetArray = new Float32Array(offset)
		const randomArray = new Float32Array(this.randomVal)
		this.instanceMesh.geometry.setAttribute('poinPos', new InstancedBufferAttribute(offsetArray, 3))
		this.instanceMesh.geometry.setAttribute('randomVal', new InstancedBufferAttribute(randomArray, 1))
		this.add(this.instanceMesh)
	}

	randomizeMatrix(matrix, x, y, z) {
		const position = new Vector3()
		const rotation = new Euler()
		const quaternion = new Quaternion()
		const scale = new Vector3()

		position.x = x
		position.y = y
		position.z = z

		rotation.x = Math.random() * 2 * Math.PI
		rotation.y = Math.random() * 2 * Math.PI
		rotation.z = Math.random() * 2 * Math.PI
		rotation.x = 0
		rotation.y = 0
		rotation.z = 0

		quaternion.setFromEuler(rotation)

		scale.x = scale.y = scale.z = 0.1

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
		// this.touchTexture.update()
		// const positions = this.points.geometry.attributes.position.array
		// store.progress += 0.001
		this.dampedProgress += (store.progress - this.dampedProgress) * 0.1
		this.dampedProgressCamera += (store.progress - this.dampedProgress) * 0.001
		this.radius = 60 + this.dampedProgress * 1
		store.progress += 0.02
		// this.tl.progress(store.progress / 5)

		// for (let i = 0; i < this.count; i++) {
		// 	const i3 = i * 3
		// 	const radius = ((this.randomArray[i].random1 + 0.1) * this.radius) % 5
		// 	let randomiseX = (this.randomArray[i].randomX - 0.5) * this.randomVal
		// 	let randomiseY = (this.randomArray[i].randomY - 0.5) * this.randomVal
		// 	randomiseX = (this.randomArray[i].randomX) * (i % 2 - 0.5) * this.randomVal
		// 	randomiseY = (this.randomArray[i].randomY) * ((i + 1) % 3 - 0.5) * this.randomVal
		// 	const branchOdd = i % 2 - 0.5
		// 	const mixedColor = new Color(store.Gui.options.stars.color1).clone()
		// 	mixedColor.lerp(new Color(store.Gui.options.stars.color2), radius * 5 / 5)

		// 	// positions[i3] = (randomiseX)
		// 	// positions[i3 + 1] = (randomiseY)

		// 	this.colors[i3] = mixedColor.r
		// 	this.colors[i3 + 1] = mixedColor.g
		// 	this.colors[i3 + 2] = mixedColor.b
		// }

		// this.points.geometry.attributes.position.needsUpdate = true
		// this.points.geometry.attributes.color.needsUpdate = true

		// store.camera.rotation.set(0, 0, this.dampedProgressCamera * 1.5)
		const matrix = new Matrix4()
		// if (!store.motion) {
		// 	for (let i = 0; i < this.count; i++) {
		// 		this.originalMatrix[i].decompose(this.dummy.position, this.dummy.rotation, this.dummy.scale)
		// 		this.dummy.position.x += Math.sin(time) * this.randomVal[i].x
		// 		this.dummy.position.y += Math.sin(time) * this.randomVal[i].y
		// 		this.dummy.position.z += Math.sin(time) * this.randomVal[i].z
		// 		this.dummy.updateMatrix()
		// 		this.instanceMesh.setMatrixAt(i, this.dummy.matrix)
		// 		this.instanceMesh.getMatrixAt(i, matrix)
		// 	}
		// } else {
		// 	for (let i = 0; i < this.count; i++) {
		// 		this.originalMatrix[i].decompose(this.dummy.position, this.dummy.rotation, this.dummy.scale)
		// 		this.dummy.position.x += Math.sin(time) * this.randomVal[i].x
		// 		this.dummy.position.y += store.motion.acceleration.y
		// 		this.dummy.position.z += Math.sin(time) * this.randomVal[i].z
		// 		this.dummy.updateMatrix()
		// 		this.instanceMesh.setMatrixAt(i, this.dummy.matrix)
		// 		this.instanceMesh.getMatrixAt(i, matrix)
		// 	}
		// }

		this.instanceMesh.instanceMatrix.needsUpdate = true
		this.instanceMesh.material.uniforms.uTime.value = time
		store.camera.rotation.set(0, 0, 0)
	}

	onResize = () => {
		store.camera.aspect = store.window.w / store.window.h
		store.camera.updateProjectionMatrix()
	}

	load() {
		this.assets = {
			textures: {},
			models: {}
		}
	}
}