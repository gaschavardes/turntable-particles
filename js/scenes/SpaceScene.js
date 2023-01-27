import { Color, Fog, Mesh, PerspectiveCamera, Scene, TorusKnotBufferGeometry } from 'three'
import { BasicMaterial } from '../materials'
import store from '../store'
import { E } from '../utils'
import GlobalEvents from '../utils/GlobalEvents'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'

export default class SpaceScene extends Scene {
	constructor() {
		super()

		this.load()
		const renderPass = new RenderPass(this, store.camera)
		renderPass.clear = false
		renderPass.clearDepth = true
		renderPass.enabled = true
		store.WebGL.composerPasses.add(renderPass, 2)

		E.on('App:start', () => {
			this.build()
			this.addEvents()
		})
	}

	build() {
		this.torus = new Mesh(
			new TorusKnotBufferGeometry(1, 0.4, 132, 16),
			new BasicMaterial()
		)

		this.add(this.torus)
	}

	addEvents() {
		E.on(GlobalEvents.RESIZE, this.onResize)
		store.RAFCollection.add(this.onRaf, 3)
	}

	onRaf = (time) => {
		this.torus.rotation.set(0, time * 2, 0)
		// store.WebGL.starRenderer.render(this, store.camera)
	}

	onResize = () => {
		this.camera.aspect = store.window.w / store.window.h
		this.camera.updateProjectionMatrix()
	}

	load() {
		this.assets = {
			models: {},
			textures: {}
		}

		const glbs = {
			planet1: '1-planet-dc.glb',
			planet2: '2-planet-dc.glb',
			planet3: '3-planet-dc.glb',
			planet4: '4-planet-dc.glb',
			planet5: '5-planet-dc.glb'

		}

		const ktxTextures = {
			homeRoom: 'room-1',
			contactRoom: 'room-2',
			chair: 'chair',
			pillows: 'pillows',
			rock: 'rocks',
			table: 'table',
			pearlMatcap: 'pearl-matcap',
			particle: 'particles',
			skymap: 'skymap-tile',
			aoMap: 'ao'
		}

		for (const key in glbs) {
			store.AssetLoader.loadGltf(cacheBustUrl(`models/home/${glbs[key]}`)).then(gltf => {
				this.assets.models[key] = gltf.scene.children[0]
			})
		}

		for (const key in ktxTextures) {
			store.AssetLoader.loadKtxTexture(cacheBustUrl(`images/home/${ktxTextures[key]}.ktx2`)).then(texture => {
				this.assets.textures[key] = texture
			})
		}

		store.AssetLoader.loadTexture(cacheBustUrl('images/home/blade.jpg')).then(texture => {
			this.assets.textures.blade = texture
		})

		store.AssetLoader.loadGltf(cacheBustUrl(`models/home/objectsData.glb`)).then(gltf => {
			this.assets.objectsData = gltf.scene
		})
	}
}