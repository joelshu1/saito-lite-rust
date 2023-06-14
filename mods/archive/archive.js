const ModTemplate = require("../../lib/templates/modtemplate");
const saito = require("../../lib/saito/saito");
const JSON = require("json-bigint");

//
// HOW THE ARCHIVE SAVES TXS
//
// modules call ---> app.storage.saveTransaction()
//    ---> saveTransaction() sends TX to peers via "archive" request="save" transaction
//    ---> peers receive by handlePeerTransaction();
//    ---> peers save to DB
//
// HOW THE ARCHIVE LOADS TXS
//
// modules call ---> app.storage.loadTransaction()
//    ---> loadTransaction() sends TX to peers via "archive" request="save" transaction
//    ---> peers receive by handlePeerTransaction();
//    ---> peers fetch from DB, return via callback or return TX
//
class Archive extends ModTemplate {

  constructor(app) {

    super(app);

    this.name = "Archive";
    this.description = "Supports the saving and serving of network transactions";
    this.categories = "Utilities Core";

    //
    // settings
    //
    this.archive = {};
    this.archive.index_blockchain = 0;
    if (this.app.BROWSER == 0) { this.archive.index_blockchain = 1; }

    app.connection.on("archive-save-transaction", (data) => {
      alert("RECEIVED ARCHIVE SAVE TRANSACTION BROADCAST -- update this");
    });
  }


  initialize(app) {
    //this.load();
  }




  returnServices() {
    let services = [];
    if (this.app.BROWSER == 0) {
      services.push({ service: "archive" });
    }
    return services;
  }






  //
  // by default we just save everything that is an application
  //
  onConfirmation(blk, tx, conf, app) {

    //
    // save all on-chain transactions
    //
    //if (conf == 0 && this.archive.index_blockchain == 1) {
    if (conf == 0) {
      let txmsg = tx.returnMessage();

      let block_id = 0;
      let block_hash = "";
      let field1 = "";
      let field2 = "";
      let field3 = "";

      if (blk.block.id) {
         block_id = blk.block.id;
      }
      if (blk.returnHash()) {
         block_hash = blk.returnHash();
      }
      if (txmsg.type) {
        field1 = txmsg.type;
      }
      if (tx.transaction.from.length > 0) {
        field2 = tx.transaction.from[0].add;
      }
      if (tx.transaction.to.length > 0) {
        field3 = tx.transaction.to[0].add;
      }

      this.saveTransaction(tx, { block_id : block_id , block_hash : block_hash , field1 : field1 , field2 : field2, field3 : field3 }, 1);

    }

  }



  async handlePeerTransaction(app, tx = null, peer, mycallback) {

    if (tx == null) { return; }
    let req = tx.returnMessage();
    if (req.request == null) { return; }
    if (req.data == null) { return; }

    var txs;
    var response = {};

    //
    // saves TX containing archive insert instruction
    //
    if (req.request === "archive") {

      if (req.data.request === "delete") {
        this.deleteTransaction(req.data.tx, req.data);
      }
      if (req.data.request === "save") {
        this.saveTransaction(req.data.tx, req.data);
      }
      if (req.data.request === "load") {
        this.loadTransaction(req.data.tx, req.data);
      }
      if (req.data.request === "update") {
        this.updateTransaction(req.data.tx, req.data);
      }
    }

    super.handlePeerTransaction(app, tx, peer, mycallback);

  }


  //////////
  // save //
  //////////
  async saveTransaction(tx, obj = {} , onchain = 0) {

    if (!obj.tx_id) 		{ obj.tx_id = ""; }
    if (!obj.publickey) 	{ obj.publickey = ""; }
    if (!obj.owner) 		{ obj.owner = ""; }
    if (!obj.sig) 		{ obj.sig = ""; }
    if (!obj.field1) 		{ obj.field1 = ""; }
    if (!obj.field2) 		{ obj.field2 = ""; }
    if (!obj.field3) 		{ obj.field3 = ""; }
    if (!obj.block_id) 		{ obj.block_id = ""; }
    if (!obj.block_hash) 	{ obj.block_hash= ""; }
    if (!obj.preserve) 		{ obj.preserve = ""; }

    //
    // insert transaction
    //
    let sql = `INSERT OR IGNORE INTO txs (tx) VALUES ($tx)`;
    let params = { $tx: tx.serialize_to_web(this.app) };
    let tx_id = await this.app.storage.insertDatabase(sql, params, "archive");

    //
    // insert index record
    //
    sql = `INSERT OR IGNORE INTO archives (
      tx_id, 
      publickey, 
      owner, 
      sig, 
      field1, 
      field2, 
      field3, 
      block_id, 
      block_hash, 
      preserve
    ) VALUES (
      $tx_id, 
      $publickey, 
      $owner, 
      $sig, 
      $field1, 
      $field2, 
      $field3, 
      $block_id, 
      $block_hash, 
      $preserve
    )`;
    params = {
      $tx_id : tx_id ,
      $publickey : obj.publickey ,
      $owner :  obj.owner ,
      $sig :  obj.sig ,
      $field1 : obj.field1 ,
      $field2 : obj.field2 ,
      $field3 : obj.field3 ,
      $block_id : obj.block_id ,
      $block_hash :  obj.block_hash ,
      $preserve : obj.preserve
    }
    let archives_id = await this.app.storage.insertDatabase(sql, params, "archive");

  }

  ////////////
  // update //
  ////////////
  async updateTransaction(tx, obj={}) {

    //
    // only owner can update
    //
    if (tx.transaction.from[0].add != obj.owner && obj.sig != "") {
      console.log("Archive: only owner has the rights to modify records");
      return 0;
    }

    //
    // update records
    //
    if (!obj.tx_id) 		{ obj.tx_id = ""; }
    if (!obj.publickey) 	{ obj.publickey = ""; }
    if (!obj.owner) 		{ obj.owner = ""; }
    if (!obj.sig) 		{ obj.sig = ""; }
    if (!obj.field1) 		{ obj.field1 = ""; }
    if (!obj.field2) 		{ obj.field2 = ""; }
    if (!obj.field3) 		{ obj.field3 = ""; }
    if (!obj.block_id) 		{ obj.block_id = ""; }
    if (!obj.block_hash) 	{ obj.block_hash= ""; }
    if (!obj.preserve) 		{ obj.preserve = ""; }

    //
    // find entries to update
    //
    let sql = `SELECT id , tx_id FROM archives WHERE owner = $owner AND sig = $sig`;
    let params = { $owner : obj.owner && $sig : obj.sig };
    let rows = await this.app.storage.queryDatabase(sql, params, "archive");
    if (rows.length < 1) { return; }
    let id  	= rows[0].id;
    let tx_id 	= rows[0].tx_id;

    //
    // update index
    //
    sql = `UPDATE archives SET owner = $owner , preserve = $preserve WHERE id = $id AND sig = $sig`;
    params = {
      $id : id ,
      $tx_id : tx_id ,
      $owner :  obj.owner ,
      $sig :  obj.sig ,
    }
    await this.app.storage.executeDatabase(sql, params, "archive");
    
    //
    // update tx
    //
    sql = `UPDATE txs SET tx = $tx WHERE tx_id = $tx_id`;
    params = {
      $tx_id : tx_id ,
      $tx :  tx.serialize_to_web(this.app)
    }
    await this.app.storage.executeDatabase(sql, params, "archive");

    return 1;
 
  }


  //////////
  // load //
  //////////
  async loadTransactions(tx, obj={}) {

    let num = 10;
    let txs = [];

    //
    // ACCEPT REASONABLE LIMITS
    //
    if (obj.num && obj.num <= 100) { num = obj.num; }

    //
    // SEARCH BASED ON CRITERIA PROVIDED
    //
    if (obj.field1) {
      let sql = "SELECT * FROM archives JOIN txs WHERE archives.field1 = $field1 AND txs.id = archives.tx_id ORDER BY archives.id DESC LIMIT $num";
      let params = { $field1 : obj.field1 , $num : num };
      let rows = await this.app.storage.queryDatabase(sql, params, "archive");
    }
    if (obj.field2) {
      let sql = "SELECT * FROM archives JOIN txs WHERE archives.field2 = $field2 AND txs.id = archives.tx_id ORDER BY archives.id DESC LIMIT $num";
      let params = { $field2 : obj.field2 , $num : num };
      let rows = await this.app.storage.queryDatabase(sql, params, "archive");
    }
    if (obj.field3) {
      let sql = "SELECT * FROM archives JOIN txs WHERE archives.field3 = $field3 AND txs.id = archives.tx_id ORDER BY archives.id DESC LIMIT $num";
      let params = { $field3 : obj.field3 , $num : num };
      let rows = await this.app.storage.queryDatabase(sql, params, "archive");
    }
    if (obj.owner) {
      let sql = "SELECT * FROM archives JOIN txs WHERE archives.owner = $owner AND txs.id = archives.tx_id ORDER BY archives.id DESC LIMIT $num";
      let params = { $owner : obj.owner , $num : num };
      let rows = await this.app.storage.queryDatabase(sql, params, "archive");
    }
    if (obj.publickey) {
      let sql = "SELECT * FROM archives JOIN txs WHERE archives.publickey = $publickey AND txs.id = archives.tx_id ORDER BY archives.id DESC LIMIT $num";
      let params = { $publickey : obj.publickey , $num : num };
      let rows = await this.app.storage.queryDatabase(sql, params, "archive");
    }
    if (obj.sig) {
      let sql = "SELECT * FROM archives JOIN txs WHERE archives.sig = $sig AND txs.id = archives.tx_id ORDER BY archives.id DESC LIMIT $num";
      let params = { $sig : obj.sig , $num : num };
      let rows = await this.app.storage.queryDatabase(sql, params, "archive");
    }

    //
    // FILTER FOR TXS
    //
    if (rows != undefined) {
      if (rows.length > 0) {
        for (let i = 0; i < rows.length; i++) {
          txs.push({ tx: rows[i].tx });
        }
      }
    }

    return txs;

  }

  ////////////
  // delete //
  ////////////
  async deleteTransaction(tx, obj={}) {
  }

  ////////////
  // delete //
  ////////////
  async deleteTransactions(type = "all", publickey = null) {
  }




  //////////////////////////
  // listen to everything //
  //////////////////////////
  shouldAffixCallbackToModule() { return 1; }


  ///////////////
  // save/load //
  ///////////////
  load() {
    if (this.app.options.archive) {
      this.archive = this.app.options.archive;
    } else {
      this.archive = {};
      this.archive.index_blockchain = 0;
      if (this.app.BROWSER == 0) {
	this.archive.index_blockchain = 1;
      }
      this.save(); 
    }
  }
 
  save() {
    this.app.options.archive = this.archive;
    this.app.storage.saveOptions();
  }
    
    



}

module.exports = Archive;
