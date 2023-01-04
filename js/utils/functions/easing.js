
export default class Easing {
	easeInQuad = (t, b, c, d) => {
		t /= d
		return c * t * t + b
	}

	easeOutQuad = (t, b, c, d) => {
		t /= d
		return -c * t * (t - 2) + b
	}

	easeInOutQuad = (t, b, c, d) => {
		t /= d / 2
		if (t < 1) return c / 2 * t * t + b
		t--
		return -c / 2 * (t * (t - 2) - 1) + b
	}

	easeInOutQuart = (t, b, c, d) => {
		if ((t /= d / 2) < 1) {
			return c / 2 * t * t * t * t + b
		} else {
			return -c / 2 * ((t -= 2) * t * t * t - 2) + b
		}
	}

	easeInSine = (t, b, c, d) => {
		return -c * Math.cos(t / d * (Math.PI / 2)) + c + b
	}

	easeOutSine = (t, b, c, d) => {
		return c * Math.sin(t / d * (Math.PI / 2)) + b
	}

	easeInOutSine = (t, b, c, d) => {
		return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b
	}
}
