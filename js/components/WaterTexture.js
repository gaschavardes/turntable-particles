import { Texture, Vector2 } from "three"
import { E } from '../utils'
import GlobalEvents from '../utils/GlobalEvents'
import store from '../store'
const easeOutSine = (t, b, c, d) => {
	return c * Math.sin((t / d) * (Math.PI / 2)) + b
}

const easeOutQuad = (t, b, c, d) => {
	t /= d
	return -c * t * (t - 2) + b
}

export default class WaterTexture {
	constructor(options) {
		this.size = 64
		this.points = []
		this.radius = this.size * 0.1
		this.width = this.height = this.size
		this.maxAge = 100
		this.last = null
		this.rect = { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight }

		this.mouse = new Vector2()
		if (options.debug) {
			// this.width = window.innerWidth
			// this.height = window.innerHeight
			// this.radius = this.width * 0.1
		}

		E.on(GlobalEvents.MOUSEMOVE, this.onMove)
		this.initTexture()
		if (options.debug) document.body.append(this.canvas)
	}

	// Initialize our canvas
	initTexture() {
		this.canvas = document.createElement("canvas")
		this.canvas.id = "WaterTexture"
		this.canvas.width = this.width
		this.canvas.height = this.height
		this.ctx = this.canvas.getContext("2d")
		this.texture = new Texture(this.canvas)
		this.clear()
	}

	clear() {
		this.ctx.fillStyle = "black"
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
	}

	onMove = (e) => {
		const point = {
			x: e.clientX / window.innerWidth,
			y: e.clientY / window.innerHeight
		}
		this.addPoint(point)
	}

	addPoint(point) {
		let force = 0
		let vx = 0
		let vy = 0
		const last = this.last
		if (last) {
			const relativeX = point.x - last.x
			const relativeY = point.y - last.y
			// Distance formula
			const distanceSquared = relativeX * relativeX + relativeY * relativeY
			const distance = Math.sqrt(distanceSquared)
			// Calculate Unit Vector
			vx = relativeX / distance
			vy = relativeY / distance

			force = Math.min(distanceSquared * 10000, 1)
		}

		this.last = {
			x: point.x,
			y: point.y
		}
		this.points.push({ x: point.x, y: point.y, age: 0, force, vx, vy })
	}

	update() {
		this.clear()
		const agePart = 1 / this.maxAge
		this.points.forEach((point, i) => {
			const slowAsOlder = 1 - point.age / this.maxAge
			const force = point.force * agePart * slowAsOlder * 0.5
			point.x += point.vx * force
			point.y += point.vy * force
			point.age += 1
			if (point.age > this.maxAge) {
				this.points.splice(i, 1)
			}
		})
		this.points.forEach(point => {
			this.drawPoint(point)
		})
		this.texture.needsUpdate = true
	}

	drawPoint(point) {
		// Convert normalized position into canvas coordinates
		const pos = {
			x: point.x * this.width,
			y: point.y * this.height
		}
		const radius = this.radius
		const ctx = this.ctx

		let intensity = 1
		if (point.age < this.maxAge * 0.3) {
			intensity = easeOutSine(point.age / (this.maxAge * 0.3), 0, 1, 1)
		} else {
			intensity = easeOutQuad(
				1 - (point.age - this.maxAge * 0.3) / (this.maxAge * 0.7),
				0,
				1,
				1
			)
		}
		intensity *= point.force

		const red = ((point.vx + 1) / 2) * 255
		const green = ((point.vy + 1) / 2) * 255
		// B = Unit vector
		const blue = intensity * 255
		const color = `${red}, ${green}, ${blue}`

		const offset = this.width * 5
		// 1. Give the shadow a high offset.
		ctx.shadowOffsetX = offset
		ctx.shadowOffsetY = offset
		ctx.shadowBlur = radius * 1
		ctx.shadowColor = `rgba(${color},${0.2 * intensity})`

		this.ctx.beginPath()
		this.ctx.fillStyle = "rgba(255,0,0,1)"
		// 2. Move the circle to the other direction of the offset
		this.ctx.arc(pos.x - offset, pos.y - offset, radius, 0, Math.PI * 2)
		this.ctx.fill()
	}
}
