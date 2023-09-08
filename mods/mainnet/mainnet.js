const ModTemplate = require("./../../lib/templates/modtemplate");
const PeerService = require("saito-js/lib/peer_service").default;

class Mainnet extends ModTemplate {

  constructor(app) {

    super(app);

    this.app = app;
    this.name = "Mainnet";
    this.description = "Migrate ERC20 tokens to Saito Mainnet";
    this.categories = "Core Utilities Messaging";
    this.publickey = "";

    return this;
  }

  async onConfirmation(blk, tx, conf) {}
  }

  async render() {

    if (!this.browser_active) { return; }

    this.publickey = await this.app.wallet.getPublicKey();

    //
    // 
    //
    let pk = this.app.browser.returnURLParameter("publickey");
    let erc20 = this.app.browser.returnURLParameter("erc20");
    let email = this.app.browser.returnURLParameter("email");

    if (pk && erc20) {

	document.querySelector(".withdraw-outtro").style.display = "none";
	document.querySelector(".withdraw-title").innerHTML = "Confirm Transfer";
	document.querySelector(".withdraw-intro").innerHTML = `Please confirm your ERC20 transfer is complete`;
	document.querySelector(".withdraw-button").innerHTML = `confirm`;
	document.querySelector("#email").style.display = "none";
	document.querySelector("#publickey").style.display = "none";
	document.querySelector("#erc20").style.display = "none";

        let el2 = document.querySelector(".withdraw-button");
        el2.onclick = (e) => {
	
	  let mailrelay_mod = this.app.modules.returnModule("MailRelay");
	  if (!mailrelay_mod) { 
	    alert("Your Saito install does not contain email support, please write the project manually to complete token withdrawal");
	    return;
	  }

	  let emailtext = `

	  Dear Saitozen,

	  Token withdrawal requested:

	  <p></p>

	  From: ${erc20}

	  <p></p>

	  To: ${pk}

	  <p></p>

	  Email: ${email}

	  <p></p>

	  Token transfer should be recorded at:

	  <p></p>

	  0x24F10EA2827717770270e3cc97F015Ba58fcB9b6

	  <p></p>

 	  -- Saito Mainnet Transfer Service

	  `;

	  mailrelay_mod.sendMailRelayTransaction(email, "info@saito.tech", "Saito Token Withdrawal Request (action required)", emailtext, true, "", "migration@saito.io");

	  document.querySelector(".withdraw-intro").innerHTML = "Your request is now processing. Please contact us by email if you do not receive confirmation of token issuance within 24 hours.";
	  document.querySelector(".withdraw-outtro").style.display = "none";
	  document.querySelector(".withdraw-title").innerHTML = "Request in Process";
	  document.querySelector(".withdraw-button").style.display = "none";

	}

        return;
    }

    let el = document.querySelector(".withdraw-button");
    el.onclick = (e) => {

        let email = document.querySelector("#email").value;
        let erc20 = document.querySelector("#erc20").value;
        let publickey = document.querySelector("#publickey").value;

        //
        //
        //
	if (publickey !== this.publickey) {
	  alert("The publickey provided is not the publickey of this wallet. To avoid problems please request token withdrawal from the wallet which will receive the tokens");
	  return;
	} else {
	  let c = confirm("I confirm that I have backed up this wallet.");
	  if (c) {
	  } else {
	    alert("Please backup your wallet before continuing. The project cannot be responsible for lost or misplaced private keys");
	  }
	}

	let mailrelay_mod = this.app.modules.returnModule("MailRelay");
	if (!mailrelay_mod) { 
	  alert("Your Saito install does not contain email support, please write the project manually to process token withdrawal");
	  return;
	}

	let emailtext = `

	  Dear Saitozen,

	  You have provided the following ERC20 address:

	  <p></p>

	  ${erc20}

	  <p></p>

	  And the following Saito address / publickey:

	  <p></p>

	  ${publickey}

	  <p></p>

	  If this information is correct, complete your withdrawal by sending your ERC20 tokens to our monitored multisig address:

	  <p></p>

	  0x24F10EA2827717770270e3cc97F015Ba58fcB9b6

	  <p></p>

	  Once the transfer is complete, please click on the following link and confirm the submission - our team will complete the transfer within 24 hours:

	  <p></p>

	  http://localhost:12101/mainnet?publickey=${publickey}&erc20=${erc20}&email=${email}

	  <p></p>

	  Please reach out by email if you do not hear from us in a day.

	  <p></p>

 	  -- The Saito Team

	`;

	mailrelay_mod.sendMailRelayTransaction("migration@saito.io", "info@saito.tech", "Saito Token Withdrawal (mainnet)", emailtext, true);

	document.querySelector(".withdraw-outtro").style.display = "none";
	document.querySelector(".withdraw-title").innerHTML = "Email Sent";
	document.querySelector(".withdraw-intro").innerHTML = `We have emailed you instructions on transferring your ERC20 tokens and a link to report the transfer when complete. In the event of problems please reach out directly at <i>info@saito.tech</i>.`;
	document.querySelector("#email").style.display = "none";
	document.querySelector("#publickey").style.display = "none";
	document.querySelector("#erc20").style.display = "none";
	document.querySelector(".withdraw-button").style.display = "none";

    }

  }

}

module.exports = Mainnet;


