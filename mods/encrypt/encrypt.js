/*********************************************************************************

 ENCRYPT MODULE v.2

 This is a general encryption class that permits on-chain exchange of cryptographic
 secrets, enabling users to communicate with encrypted messages over the blockchain.

 For N > 2 channels, we avoid Diffie-Hellman exchanges *for now* in order to have
 something that is fast to setup, and simply default to having the initiating user
 provide the secret, but only communicating it to members with whom he/she already
 has a shared-secret.

 This module thus does two things:

 1. create Diffie-Hellman key exchanges (2 parties)
 2. distribute keys for Groups using DH-generated keys

 The keys as well as group members / shared keys are saved in the keychain class,
 where they are generally available for any Saito application to leverage.

 UPDATE 17-7-23: We had incomplete key exchanges that couldn't be rectified because on
 party would just return out instead of responding to a re-request.

 *********************************************************************************/
var saito = require("../../lib/saito/saito");
var ModTemplate = require("../../lib/templates/modtemplate");
const Big = require("big.js");
const Transaction = require("../../lib/saito/transaction").default;

class Encrypt extends ModTemplate {
  constructor(app) {
    super(app);

    this.app = app;
    this.name = "Encrypt";
    this.encrypt = this.loadEncrypt(app);

    this.description = "A Diffie-Hellman encryption tool for Saito";
    this.categories = "Crypto Utilities";

    app.connection.on("encrypt-key-exchange", (publicKey) => {
      console.log("initiating key exchange...");
      this.initiate_key_exchange(publicKey, 0);
    });

    return this;
  }

  respondTo(type, obj) {
    let encrypt_self = this;

    if (type == "user-menu") {
      if (obj?.publicKey) {
        if (
          this.app.keychain.hasSharedSecret(obj.publicKey) ||
          obj.publicKey == encrypt_self.publicKey
        ) {
          return null;
        }
      }

      return {
        text: "Add Contact",
        icon: "far fa-id-card",
        callback: function (app, publicKey) {
          encrypt_self.app.keychain.saveKeys();
          encrypt_self.initiate_key_exchange(publicKey, 0);
          //      encrypt_self.app.connection.emit("stun-create-peer-connection", ([publicKey]));
          //
          // TODO - remove if above works
          //
          //let stun_mod = app.modules.returnModule("Stun");
          //stun_mod.createStunConnectionWithPeers([public_key]);
        },
      };
    }
    return super.respondTo(type);
  }

  async handlePeerTransaction(app, newtx = null, peer, mycallback) {
    if (newtx == null) {
      return;
    }
    let message = newtx.returnMessage();

    if (message.request === "diffie hellman key exchange") {
      let tx = new Transaction(undefined, message.data.tx);

      let sender = tx.from[0].publicKey;
      let receiver = tx.to[0].publicKey;
      let txmsg = tx.returnMessage();
      let request = txmsg.request; // "request"

      //
      // key exchange requests
      //
      if (txmsg.request == "key exchange request") {
        if (receiver == this.publicKey) {
          console.log("\n\n\nYou have accepted an encrypted channel request from " + receiver);
          this.accept_key_exchange(tx, 1, peer);
        }
      }
    }

    if (message.request === "diffie hellman key response") {
      let tx = new Transaction(undefined, message.data.tx);

      let sender = tx.from[0].publicKey;
      let receiver = tx.to[0].publicKey;
      let txmsg = tx.returnMessage();
      let request = txmsg.request; // "request"

      //
      // copied from onConfirmation
      //
      let bob_publicKey = Buffer.from(txmsg.bob, "hex");

      var senderkeydata = app.keychain.returnKey(sender);

      if (senderkeydata == null) {
        if (app.BROWSER == 1) {
          alert("Cannot find original diffie-hellman keys for key-exchange");
          return;
        }
      }

      let alice_publicKey = Buffer.from(senderkeydata.aes_publicKey, "hex");
      let alice_privatekey = Buffer.from(senderkeydata.aes_privatekey, "hex");
      let alice = app.crypto.createDiffieHellman(alice_publicKey, alice_privatekey);
      let alice_secret = alice.computeSecret(bob_publicKey);
      //app.crypto.createDiffieHellmanSecret(alice, bob_publicKey);

      app.keychain.updateCryptoByPublicKey(
        sender,
        alice_publicKey.toString("hex"),
        alice_privatekey.toString("hex"),
        alice_secret.toString("hex")
      );

      //
      //
      //
      this.sendEvent("encrypt-key-exchange-confirm", {
        members: [sender, this.publicKey],
      });
      this.saveEncrypt();
    }
  }

  async onPeerHandshakeComplete(app, peer) {
    if (app.BROWSER == 0) {
      return;
    }

    //
    // try to connect with friends in pending list
    //
    if (this.encrypt) {
      if (this.encrypt.pending) {
        for (let i = 0; i < this.encrypt.pending.length; i++) {
          this.initiate_key_exchange(this.encrypt.pending[i]);
        }
        this.encrypt.pending = [];
        this.saveEncrypt();
      }
      //
      // Try again for partial key exchanges!
      //
      for (let key of this.app.keychain.returnKeys()) {
        if ((key.aes_privatekey || key.aes_publicKey) && !key.aes_secret) {
          this.initiate_key_exchange(key.publicKey);
        }
      }
    }

    //
    // check if we have a diffie-key-exchange with peer
    //
    //if (peer.peer.publicKey != "") {
    //  if (!app.keychain.hasSharedSecret(peer.peer.publicKey)) {
    //  this.initiate_key_exchange(peer.peer.publicKey, 1, peer);  // offchain diffie-hellman with server
    //  }
    //}
  }

  //
  // recipients can be a string (single address) or an array (multiple addresses)
  //
  async initiate_key_exchange(recipients, offchain = 0, peer = null) {
    let recipient = "";
    let parties_to_exchange = 2;

    if (Array.isArray(recipients)) {
      if (recipients.length > 0) {
        recipients.sort();
        recipient = recipients[0];
        parties_to_exchange = recipients.length;
      } else {
        recipient = recipients;
        parties_to_exchange = 2;
      }
    } else {
      recipient = recipients;
      parties_to_exchange = 2;
    }

    console.log("recipient is: " + recipient);
    if (recipient == "") {
      return;
    }

    let tx = null;
    try {
      tx = await this.app.wallet.createUnsignedTransactionWithDefaultFee(
        recipient,
        BigInt(0)
        //BigInt(parties_to_exchange * this.app.wallet.default_fee)
      );
    } catch (err) {
      console.log("error: " + err);
    }

    //
    // we had an issue creating the transaction, try zero-fee
    //
    if (!tx) {
      console.log("zero fee tx creating...");
      tx = await this.app.wallet.createUnsignedTransaction(recipient, BigInt(0), BigInt(0));
    }

    tx.msg.module = this.name;
    tx.msg.request = "key exchange request";
    tx.msg.alice_publicKey = this.app.keychain.initializeKeyExchange(recipient);

    //
    // does not currently support n > 2
    //
    if (parties_to_exchange > 2) {
      for (let i = 1; i < parties_to_exchange; i++) {
        tx.addTo(recipients[i]);
      }
    }

    await tx.sign();

    //
    //
    //
    if (offchain == 0) {
      await this.app.network.propagateTransaction(tx);
    } else {
      let data = {};
      data.module = "Encrypt";
      data.tx = tx;
      this.app.network.sendRequestAsTransaction("diffie hellman key exchange", data, peer);
    }
    this.saveEncrypt();
  }

  async accept_key_exchange(tx, offchain = 0, peer = null) {
    let txmsg = tx.returnMessage();

    let remote_address = tx.from[0].publicKey;
    let our_address = tx.to[0].publicKey;
    let alice_publicKey = txmsg.alice_publicKey;

    let fee = BigInt(tx.to[0].amount);

    let bob = this.app.crypto.createDiffieHellman();
    let bob_publicKey = bob.getPublicKey(null, "compressed").toString("hex");
    let bob_privatekey = bob.getPrivateKey(null, "compressed").toString("hex");
    let bob_secret = bob.computeSecret(Buffer.from(alice_publicKey, "hex"));
    //this.app.crypto.createDiffieHellmanSecret(bob, Buffer.from(alice_publicKey, "hex"));

    var newtx = await this.app.wallet.createUnsignedTransaction(remote_address, BigInt(0), BigInt(fee));
    if (newtx == null) {
      return;
    }
    newtx.msg.module = "Encrypt";
    newtx.msg.request = "key exchange confirm";
    newtx.msg.tx_id = tx.id; // reference id for parent tx
    newtx.msg.bob = bob_publicKey;
    await newtx.sign();

    if (offchain == 0) {
      await this.app.network.propagateTransaction(newtx);
    } else {
      let data = {};
      data.module = "Encrypt";
      data.tx = newtx;
      console.log("sending request on network");
      this.app.network.sendPeerRequest("diffie hellman key response", data, peer);
    }

    this.app.keychain.updateCryptoByPublicKey(
      remote_address,
      bob_publicKey.toString("hex"),
      bob_privatekey.toString("hex"),
      bob_secret.toString("hex")
    );
    this.sendEvent("encrypt-key-exchange-confirm", { members: [remote_address, our_address] });
    this.saveEncrypt();
  }

  async onConfirmation(blk, tx, conf) {
    if (conf == 0) {
      console.log("ENCRYPT ONCONF");

      if (tx.from[0].publicKey == this.publicKey) {
        this.sendEvent("encrypt-key-exchange-confirm", {
          members: [tx.to[0].publicKey, tx.from[0].publicKey],
        });
      }
      if (tx.to[0].publicKey === this.publicKey) {
        let sender = tx.from[0].publicKey;
        let receiver = tx.to[0].publicKey;
        let txmsg = tx.returnMessage();
        let request = txmsg.request; // "request"

        //
        // key exchange requests
        //
        if (txmsg.request == "key exchange request") {
          if (sender == this.publicKey) {
            console.log("\n\n\nYou have sent an encrypted channel request to " + receiver);
          }
          if (receiver == this.publicKey) {
            console.log("\n\n\nYou have accepted an encrypted channel request from " + receiver);
            this.accept_key_exchange(tx);
          }
        }

        //
        // key confirm requests
        //
        if (txmsg.request == "key exchange confirm") {
          let bob_publicKey = Buffer.from(txmsg.bob, "hex");

          var senderkeydata = this.app.keychain.returnKey(sender);
          if (senderkeydata == null) {
            if (this.app.BROWSER == 1) {
              alert("Cannot find original diffie-hellman keys for key-exchange");
              return;
            }
          }
          let alice_publicKey = Buffer.from(senderkeydata.aes_publicKey, "hex");
          let alice_privatekey = Buffer.from(senderkeydata.aes_privatekey, "hex");
          let alice = this.app.crypto.createDiffieHellman(alice_publicKey, alice_privatekey);
          let alice_secret = alice.computeSecret(bob_publicKey);
          //this.app.crypto.createDiffieHellmanSecret(alice, bob_publicKey);

          this.app.keychain.updateCryptoByPublicKey(
            sender,
            alice_publicKey.toString("hex"),
            alice_privatekey.toString("hex"),
            alice_secret.toString("hex")
          );

          //
          //
          //
          this.sendEvent("encrypt-key-exchange-confirm", {
            members: [sender, this.publicKey],
          });
          this.saveEncrypt();
        }
      }
    }
  }

  saveEncrypt() {
    this.app.options.encrypt = this.encrypt;
    this.app.storage.saveOptions();
  }

  loadEncrypt() {
    if (this.app.options.encrypt) {
      this.encrypt = this.app.options.encrypt;
    } else {
      this.encrypt = {};
      this.encrypt.pending = [];
    }

    return this.encrypt;
  }
}

module.exports = Encrypt;
