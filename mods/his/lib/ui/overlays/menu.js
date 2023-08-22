const MenuTemplate = require('./menu.template');
const SaitoOverlay = require("./../../../../../lib/saito/ui/saito-overlay/saito-overlay");

class MenuOverlay {

    constructor(app, mod){
        this.app = app;
        this.mod = mod;
	this.visible = false;
        this.overlay = new SaitoOverlay(app, mod, false, true, true);
    }
 
    hide() {
      this.overlay.hide();
    }

    render(menu, player, faction, ops) {

      let his_self = this.mod;
      this.overlay.show(MenuTemplate());

      // 
      // duplicates code below
      //
      for (let i = 0; i < menu.length; i++) {

        let id = "";
        let cost = 100;

        if (menu[i].check(this.mod, player, faction, ops)) {
          for (let z = 0; z < menu[i].factions.length; z++) {
            if (menu[i].factions[z] === faction) { 
	      id = i;
	      cost = menu[i].cost[z];
              z = menu[i].factions.length+1;
            }
          }
        }

	let active_option = "inactive";
        if (cost <= ops) { active_option = "active card"; }

console.log(menu[i].name);
	if (!menu[i].check(this.mod, this.mod.game.player, faction, ops)) { active_option = "inactive"; }

console.log("cost and active: " + cost + " - " + active_option);

	if (cost != 100) {
	  let html = `
	    <div id="${id}" class="menu-option-container ${active_option}">
	      <div class="menu-option-image">
	        <img src="${menu[i].img}" />
	      </div>
	      <div class="menu-option-title">${menu[i].name} [${cost}]</div>
	    </div>
	  `;

	  if (active_option !== "inactive") {
            this.app.browser.addElementToSelector(html, `.menu`);
	  }

        }
      }

      this.attachEvents();

    }

    attachEvents() {}

}

module.exports = MenuOverlay;



