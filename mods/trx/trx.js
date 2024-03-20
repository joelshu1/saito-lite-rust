const saito = require('./../../lib/saito/saito');
const ModTemplate = require('../../lib/templates/modtemplate');

class TRX extends ModTemplate {
	constructor(app) {
		super(app);

		this.appname = 'TRX';
		this.name = 'TRX';
		this.ticker = 'TRX';
		this.slug = 'trx';
		this.description =
			'Adds support for Mixin-powered Ethereum transfers on the Saito Network';
		this.categories = 'Cryptocurrency Finance';
		// MIXIN STUFF
		this.asset_id = '25dabac5-056a-48ff-b9f9-f67395dc407c';
		this.chain_id = '25dabac5-056a-48ff-b9f9-f67395dc407c';
		this.decimals = 8;
	}

	respondTo(type = '', obj) {
		if (type == 'mixin-crypto') {
			return {
				name: this.name,
				ticker: this.ticker,
				description: this.description,
				asset_id: this.asset_id
			};
		}
		if (type == 'crypto-logo') {
			console.log(obj?.ticker);
			if (obj?.ticker == this.ticker) {
				return {
					svg: `<?xml version="1.0" encoding="utf-8"?>
            <svg version="1.1" id="图层_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
               viewBox="0 0 3000 1131.5" style="enable-background:new 0 0 3000 1131.5;" xml:space="preserve">
            <style type="text/css">
              .st0{fill:#EBEBEC;}
              .st1{fill:#EB0029;}
            </style>
            <g>
              <g>
                <rect x="1198.6" y="497.4" class="st0" width="44.4" height="289.9"/>
                <rect x="1080" y="374.6" class="st0" width="361.9" height="44.4"/>
                <rect x="1278.8" y="497.4" class="st0" width="44.4" height="289.9"/>
              </g>
              <g>
                <polygon class="st0" points="2549.8,787.6 2594.6,787.6 2594.6,613 2549.8,563.2    "/>
                <polygon class="st0" points="2785.7,374.6 2785.7,698.3 2468.8,346.1 2468.8,787.6 2513.5,787.6 2513.5,463.8 2830.6,816.1 
                  2830.6,374.6    "/>
              </g>
              <g>
                <path class="st0" d="M2178.7,374.4c-113.9,0-206.5,92.6-206.5,206.5s92.6,206.5,206.5,206.5s206.5-92.6,206.5-206.5
                  C2385.2,467.1,2292.6,374.4,2178.7,374.4z M2178.7,742.9c-89.3,0-162-72.6-162-162s72.6-162,162-162c89.3,0,162,72.6,162,162
                  C2340.7,670.2,2268,742.9,2178.7,742.9z"/>
                <path class="st0" d="M2178.7,551.2c-16.4,0-29.7,13.3-29.7,29.7s13.3,29.7,29.7,29.7s29.7-13.3,29.7-29.7
                  S2195.1,551.2,2178.7,551.2z"/>
              </g>
              <path class="st0" d="M1894.5,501.3c0-69.8-56.4-126.6-125.7-126.6h-236.2v413h44.1V419.5h192.1c44.5,0,80.7,36.7,80.7,81.8
                c0,44.9-35.7,81.4-79.8,81.9l-156.7-0.1v204.6h44.1V627.9h103.3l84.4,159.7h51.3l-88.1-166C1858.9,604.7,1894.5,555.5,1894.5,501.3
                z"/>
            </g>
            <path class="st1" d="M774.7,292.8L172.9,182.1l316.7,796.8l441.2-537.6L774.7,292.8z M765.1,341.6l92.1,87.5l-251.8,45.6
              L765.1,341.6z M550.7,465.6L285.3,245.5L719,325.3L550.7,465.6z M531.7,504.6l-43.2,357.7L255.2,275.1L531.7,504.6z M571.7,523.5
              L850.5,473L530.8,862.6L571.7,523.5z"/>
            </svg>`
				};
			}
		}
		return null;
	}

	//returnBalance(){
	//  return this.balance;
	//}
}

module.exports = TRX;
