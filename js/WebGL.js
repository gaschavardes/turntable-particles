import { ClampToEdgeWrapping, Clock, LinearFilter, LinearMipmapLinearFilter, Texture, WebGLRenderer, Color, MirroredRepeatWrapping, PerspectiveCamera } from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import store from './store'
import { E, qs } from './utils'
import GlobalEvents from './utils/GlobalEvents'
import ArrayOrderController from './utils/ArrayOrderController'
export default class WebGL {
	constructor() {
		this.dom = {
			canvas: qs('canvas')
		}

		this.setup()

		E.on('App:start', this.start)
	}

	setup() {
		this.camera = new PerspectiveCamera(45, store.window.w / store.window.h, 0.1, 10000)
		this.camera.position.z = 15
		store.camera = this.camera

		// this.starRenderer = new WebGLRenderer({ alpha: true, antialias: true, canvas: this.dom.canvas, powerPreference: 'high-performance', stencil: false })
		// this.starRenderer.clearAlpha = 0
		// this.starRenderer.clearColor = new Color(1, 0, 0)
		// this.starRenderer.setPixelRatio(store.window.dpr >= 2 ? 2 : store.window.dpr)
		// this.starRenderer.setSize(store.window.w, store.window.h)

		this.renderer = new WebGLRenderer({ alpha: true, antialias: true, canvas: this.dom.canvas, powerPreference: 'high-performance', stencil: true })
		this.renderer.setPixelRatio(store.window.dpr >= 2 ? 2 : store.window.dpr)
		this.renderer.setSize(store.window.w, store.window.h)

		this.composer = new EffectComposer(this.renderer)
		this.composer.setSize(store.window.w, store.window.h)
		this.composer.readBuffer.texture.wrapT = MirroredRepeatWrapping
		this.composer.readBuffer.texture.wrapS = MirroredRepeatWrapping
		this.composerPasses = new ArrayOrderController(this.composer.passes)

		this.clock = new Clock()

		this.globalUniforms = {
			uDelta: { value: 0 },
			uTime: { value: 0 }
		}
	}

	start = () => {
		this.addEvents()
	}

	addEvents() {
		E.on(GlobalEvents.RESIZE, this.onResize)
		store.RAFCollection.add(this.onRaf, 0)
	}

	onRaf = (time) => {
		this.clockDelta = this.clock.getDelta()
		this.globalUniforms.uDelta.value = this.clockDelta > 0.016 ? 0.016 : this.clockDelta
		this.globalUniforms.uTime.value = time
		this.composer.render()
	}

	onResize = () => {
		this.renderer.setSize(store.window.w, store.window.h)
	}

	generateTexture(texture, options = {}, isKtx = false) {
		if (texture instanceof HTMLImageElement) {
			texture = new Texture(texture)
		}
		texture.minFilter = options.minFilter || (isKtx ? LinearFilter : LinearMipmapLinearFilter)
		texture.magFilter = options.magFilter || LinearFilter
		texture.wrapS = texture.wrapT = options.wrapping || ClampToEdgeWrapping
		this.renderer.initTexture(texture)
		return texture
	}
}