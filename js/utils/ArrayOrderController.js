export default class ArrayOrderController {
	constructor(sourceArray) {
		this.array = []
		this.sourceArray = sourceArray || []
	}

	add(item, index) {
		this.array.push({ index, item })
		this.array.sort(this.sort)
		this.updateSourceArray()
	} 

	remove(item) {
		for (let i = 0; i < this.array.length; i++) {
			if (this.array[i].item === item) this.array.splice(i, 1)
		}
		this.updateSourceArray()
	}

	updateSourceArray() {
		this.sourceArray.length = 0
		for (let i = 0; i < this.array.length; i++) {
			this.sourceArray[i] = this.array[i].item
		}
	}

	sort(a, b) {
		return a.index > b.index ? 1 : -1
	}
}