import MainScene from './scenes/MainScene'
import SpaceScene from './scenes/SpaceScene'
import store from './store'
import { AssetLoader, E, RAFCollection } from './utils'
import GlobalEvents from './utils/GlobalEvents'
import WebGL from './WebGL'

store.RAFCollection = new RAFCollection()
store.AssetLoader = new AssetLoader()

store.WebGL = new WebGL()
// store.SpaceScene = new SpaceScene()
store.MainScene = new MainScene()

setTimeout(() => {
}, 5000)

GlobalEvents.detectTouchDevice()
GlobalEvents.enableRAF(true)
GlobalEvents.enableResize()
GlobalEvents.enableMousemove()

window.store = store

store.AssetLoader.load().then(() => {
	E.emit('App:start')
})

if (new URLSearchParams(window.location.search).has('gui')) {
	import('./utils/Gui').then(({ Gui }) => {
		E.on('App:start', () => {
			store.Gui = new Gui()
		})
	})
}
const getMobileOS = () => {
	const ua = navigator.userAgent
	if (/android/i.test(ua)) {
		return "Android"
	} else if ((/iPad|iPhone|iPod/.test(ua)) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
		return "iOS"
	}
	return "Other"
}
console.log(getMobileOS())
const button = document.querySelector('.device-motion')
button.addEventListener('click', () => {
	console.log(getMobileOS(), window.DeviceMotionEvent, store.isTouch)
	if (window.DeviceMotionEvent && store.isTouch) {
		// this.$parent.playVid()
		if (getMobileOS() === 'iOS') {
			DeviceMotionEvent.requestPermission()
				.then((response) => {
					if (response === 'granted') {
						window.addEventListener('devicemotion', (e) => {
							store.progress += (e.rotationRate.gamma * (Math.PI / 360)) / 57.32
							// console.log('GAMMA ROTATE', store.progress)
							store.motion = e
							store.acceleration = e.acceleration
						})
						button.classList.add('hide')
					}
				})
				.catch(console.error)
			// DeviceOrientationEvent.requestPermission()
			// 	.then((response) => {
			// 		if (response === 'granted') {
			// 		// window.addEventListener('devicemotion', event => this.moveGyroscope(event))
			// 		}
			// 	})
			// 	.catch(console.error)
		} else {
			window.addEventListener('devicemotion', (e) => {
				store.progress += (e.rotationRate.gamma * (Math.PI / 360)) / 57.32
				// console.log('GAMMA ROTATE', store.progress)
				store.motion = e
				store.acceleration = e.acceleration
			})
			button.classList.add('hide')
		}
	} else {
		// this.$parent.playVid()
	}
})
