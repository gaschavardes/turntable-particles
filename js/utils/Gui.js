import { Pane } from 'tweakpane'
import store from '../store'
import * as EssentialsPlugin from '@tweakpane/plugin-essentials'

export class Gui extends Pane {
	constructor() {
		super({
			title: 'Options'
		})

		this.containerElem_.style.width = '350px'

		this.registerPlugin(EssentialsPlugin)

		this.options = {
		}

		this.initStars()

		this.fps = this.addBlade({
			view: 'fpsgraph'
		})
	}

	initStars() {
		this.options.stars = {
			color1: store.MainScene.color1,
			color2: store.MainScene.color2
		}
		this.addInput(this.options.stars, 'color1', {
			color1: {type: 'float'},
			color2: {type: 'float'},
		})
		this.addInput(this.options.stars, 'color2', {
			
		})
	}
}