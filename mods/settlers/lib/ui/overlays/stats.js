const SettlersStatsOverlayTemplate = require('./stats.template');
const SaitoOverlay = require('./../../../../../lib/saito/ui/saito-overlay/saito-overlay');

class StatsOverlay {
	constructor(app, mod) {
		this.app = app;
		this.mod = mod;
		this.overlay = new SaitoOverlay(this.app, this.mod, false);
		this.dice_count = [];
	}

	render(winner = "") {
		this.overlay.show(SettlersStatsOverlayTemplate(this, winner));
		this.attachEvents();
	}

	attachEvents() {}
}

module.exports = StatsOverlay;
