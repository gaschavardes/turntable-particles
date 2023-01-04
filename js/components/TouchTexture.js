import { Plane, Raycaster, Vector2, Vector3, Texture } from 'three'
import store from '../store'
import Easing from '../utils/functions/easing'
import GlobalEvents from '../utils/GlobalEvents'
import { E } from '../utils'
export default class TouchTexture {
	constructor(parent) {
		this.parent = parent
		this.size = 100
		this.maxAge = 30
		this.radius = 0.1
		this.trail = []

		this.plane = new Plane()
		this.raycaster = new Raycaster()

		this.mouse = new Vector2()
		this.offset = new Vector3()
		this.intersection = new Vector3()

		this.objects = []
		this.hovered = null
		this.selected = null

		this.isDown = false

		this.rect = { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight }

		this.initTexture()
		E.on(GlobalEvents.MOUSEMOVE, this.onMove)
		this.easing = new Easing()
		// store.RAFCollection.add(this.update, 3)
	}

	initTexture() {
		this.canvas = document.createElement('canvas')
		this.canvas.width = this.canvas.height = this.size
		this.ctx = this.canvas.getContext('2d')
		this.ctx.fillStyle = 'black'
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

		this.texture = new Texture(this.canvas)

		this.canvas.id = 'touchTexture'
		this.canvas.style.width = this.canvas.style.height = `${this.canvas.width}px`
		document.body.appendChild(this.canvas)
	}

	update = (delta) => {
		this.clear()

		// age points
		this.trail.forEach((point, i) => {
			point.age++
			// remove old
			if (point.age > this.maxAge) {
				this.trail.splice(i, 1)
			}
		})
		this.trail.forEach((point, i) => {
			this.drawTouch(point)
		})

		this.texture.needsUpdate = true
	}

	clear() {
		this.ctx.fillStyle = 'black'
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
	}

	addTouch(point) {
		let force = 0
		const last = this.trail[this.trail.length - 1]
		if (last) {
			const dx = last.x - point.x
			const dy = last.y - point.y
			const dd = dx * dx + dy * dy
			force = Math.min(dd * 10000, 1)
		}
		this.trail.push({ x: point.x, y: point.y, age: 0, force })
	}

	drawTouch(point) {
		const pos = {
			x: point.x * this.size,
			y: (1 - point.y) * this.size
		}

		let intensity = 1
		if (point.age < this.maxAge * 0.3) {
			intensity = this.easing.easeOutSine(point.age / (this.maxAge * 0.3), 0, 1, 1)
		} else {
			intensity = this.easing.easeOutSine(1 - (point.age - this.maxAge * 0.3) / (this.maxAge * 0.7), 0, 1, 1)
		}

		intensity = 1
		const radius = this.size * this.radius * intensity

		const grd = this.ctx.createRadialGradient(pos.x, pos.y, radius * 0.25, pos.x, pos.y, radius)
		grd.addColorStop(0, `rgba(255, 255, 255, 0.2)`)
		grd.addColorStop(1, 'rgba(0, 0, 0, 0.0)')

		this.ctx.beginPath()
		this.ctx.fillStyle = grd
		this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2)
		this.ctx.fill()
	}

	onMove = (e) => {
		const t = (e.touches) ? e.touches[0] : e
		const touch = { x: t.clientX, y: t.clientY }
		this.mouse.x = ((touch.x + this.rect.x) / this.rect.width)
		this.mouse.y = -((touch.y + this.rect.y) / this.rect.height) + 1
		// this.drawTouch(this.mouse)
		this.addTouch(this.mouse)
	}
}