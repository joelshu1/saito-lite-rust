const saito = require("./../../lib/saito/saito");
const ModTemplate = require('../../lib/templates/modtemplate');

class RedSquare extends ModTemplate {

  constructor(app) {

    super(app);
    this.appname = "Red Square";
    this.name = "RedSquare";
    this.slug = "redsquare";
    this.description = "Open Source Twitter-clone for the Saito Network";
    this.categories = "Social Entertainment";
    this.redsquare = {}; // where settings go, saved to options file
    this.icon_fa = "fas fa-square-full";

    this.tweets = [];
    this.notifications = [];

    this.styles = [
      '/saito/saito.css',
      '/redsquare/style.css',
    ];

    this.social = {
      twitter_card: "summary",
      twitter_site: "@SaitoOfficial",
      twitter_creator: "@SaitoOfficial",
      twitter_title: "🟥 Saito Red Square",
      twitter_url: "https://saito.io/redsquare/",
      twitter_description: "Saito RedSquare - Web3 Social.",
      twitter_image: "https://saito.tech/wp-content/uploads/2022/04/saito_card_horizontal.png",
      og_title: "🟥 Saito Red Square",
      og_url: "https://saito.io/redsquare",
      og_type: "website",
      og_description: "Peer to peer social and more",
      og_site_name: "🟥 Saito Red Square",
      og_image: "https://saito.tech/wp-content/uploads/2022/04/saito_card_horizontal.png",
      og_image_url: "https://saito.tech/wp-content/uploads/2022/04/saito_card_horizontal.png",
      og_image_secure_url: "https://saito.tech/wp-content/uploads/2022/04/saito_card_horizontal.png"
    }

    return this;

  }


  initialize(app) {
    this.loadRedSquare();
    super.initialize(app);

    if (app.BROWSER === 1) {

      let tweet_id = app.browser.returnURLParameter('tweet_id');
      let user_id = app.browser.returnURLParameter('user_id');

      if (tweet_id != "") {
        this.viewing = tweet_id;
        this.mode = "tweet";
      }

      if (user_id != "") {
        this.viewing = user_id;
        this.mode = "user";
      }


      if (this.browser_active == 1) {
        //Leave a cookie trail to return to Redsquare when you enter a game
        if (app.options.homeModule !== this.returnSlug()) {
          console.log("Update homepage to " + this.returnSlug());
          app.options.homeModule = this.returnSlug();
          app.storage.saveOptions();
        }

        //
        // this is a hack to refresh the game invite sidebar if we are returning to the page after
        // it has been dormant for a while
        //
        document.addEventListener("visibilitychange", () => {
          if (!document.hidden) {
            app.connection.emit("game-invite-list-update");
          }
        });

      }

      let redsquare_self = this;

      if (this.app.BROWSER == 1 && this.browser_active == 1) {

        let tweet_timeout = 20000 + (Math.random() * 5000);
        let stats_timeout = 20000 + (Math.random() * 10000);

        setInterval(function () {
          if (redsquare_self.viewing == "feed") {
            redsquare_self.fetchNewTweets(app, redsquare_self);
          }
        }, tweet_timeout);

        setInterval(function () {
          if (redsquare_self.viewing == "feed") {
            redsquare_self.fetchStatsUpdate(app, redsquare_self);
          }
        }, stats_timeout);
      }
    }
  }


  addNotification(tx) {
  }

  addTweet(tx) {
  }

  loadNotifications() {
  }

  loadTweets() {
  }

  render(app, mod) {
    super.render(app, this);
  }

  async onPeerHandshakeComplete(app, peer) {
    this.loadTweets(app, this);
  }

  async onConfirmation(blk, tx, conf, app) {
  }




  sendLikeTransaction(app, mod, data, tx = null) {

    let redsquare_self = this;

    let obj = {
      module: redsquare_self.name,
      request: "like tweet",
      data: {},
    };
    for (let key in data) {
      obj.data[key] = data[key];
    }

    let newtx = redsquare_self.app.wallet.createUnsignedTransaction();
    for (let i = 0; i < tx.transaction.to.length; i++) {
      if (tx.transaction.to[i].add !== app.wallet.returnPublicKey()) {
        newtx.transaction.to.push(new saito.default.slip(tx.transaction.to[i].add, 0.0));
      }
    }

    newtx.msg = obj;
    newtx = redsquare_self.app.wallet.signTransaction(newtx);
    redsquare_self.app.network.propagateTransaction(newtx);

    return newtx;

  }

  async receiveLikeTransaction(blk, tx, conf, app) {

    //
    // browsers
    //
    if (app.BROWSER == 1) {

      //
      // save my likes
      //
      if (tx.isTo(app.wallet.returnPublicKey())) {
        this.app.storage.saveTransaction(tx);

        //
        // save optional likes
        //
        let txmsg = tx.returnMessage();
        if (this.txmap[txmsg.data.sig]) {
          let tweet = this.returnTweet(app, this, txmsg.data.sig);
          if (tweet == null) { return; }
          let tx = tweet.tx;
          if (!tx.optional) { tx.optional = {}; }
          if (!tx.optional.num_likes) { tx.optional.num_likes = 0; }
          tx.optional.num_likes++;
          this.app.storage.updateTransactionOptional(txmsg.data.sig, app.wallet.returnPublicKey(), tx.optional);
          tweet.renderLikes();
        } else {
          this.app.storage.incrementTransactionOptionalValue(txmsg.data.sig, "num_likes");
        }

      }


      //
      // add notification for unviewed
      //
      //console.log("ADD THIS: " + tx.transaction.ts + " > " + this.last_viewed_notifications_ts);
      if (tx.transaction.ts > this.last_viewed_notifications_ts) {
        this.addNotification(app, this, tx);
      } else {
        this.ntfs.push(tx);
      }

      return;
    }

    //
    // servers
    //
    let txmsg = tx.returnMessage();
    let sql = `UPDATE tweets SET num_likes = num_likes + 1 WHERE sig = $sig`;
    let params = {
      $sig: txmsg.data.sig,
    };
    app.storage.executeDatabase(sql, params, "redsquare");

    return;

  }


  sendTweetTransaction(app, mod, data, keys = []) {

    let redsquare_self = this;

    let obj = {
      module: redsquare_self.name,
      request: "create tweet",
      data: {},
    };
    for (let key in data) {
      obj.data[key] = data[key];
    }

    let newtx = redsquare_self.app.wallet.createUnsignedTransaction();
    newtx.msg = obj;
    for (let i = 0; i < keys.length; i++) {
      if (keys[i] !== app.wallet.returnPublicKey()) {
        newtx.transaction.to.push(new saito.default.slip(keys[i]));
      }
    }
    newtx = redsquare_self.app.wallet.signTransaction(newtx);
    redsquare_self.app.network.propagateTransaction(newtx);

    return newtx;

  }

  async receiveTweetTransaction(blk, tx, conf, app) {

    let tweet = new Tweet(app, this, tx);

    //
    // browsers
    //
    if (app.BROWSER == 1) {

      //
      // save tweets addressed to me
      //
      if (tx.isTo(app.wallet.returnPublicKey())) {
        this.app.storage.saveTransaction(tx);
        let txmsg = tx.returnMessage();

        //
        // if replies
        //
        if (txmsg.data?.parent_id) {
          if (this.txmap[txmsg.data.parent_id]) {
            let tweet = this.returnTweet(app, this, txmsg.data.sig);
            if (tweet == null) { return; }
            let tx = this.txmap[parent_id];
            if (tx.isTo(app.wallet.returnPublicKey())) {
              if (!tx.optional) { tx.optional = {}; }
              if (!tx.optional.num_replies) { tx.optional.num_replies = 0; }
              tx.optional.num_replies++;


              this.app.storage.updateTransactionOptional(txmsg.data.parent_id, app.wallet.returnPublicKey(), tx.optional);
              tweet.renderReplies();
            }
          } else {
            this.app.storage.incrementTransactionOptionalValue(txmsg.data.sig, "num_replies");
          }
        }


        //
        // if retweets
        //
        if (txmsg.data?.retweet_tx) {
          if (txmsg.data?.retweet_tx) {

            let rtxobj = JSON.parse(txmsg.data.retweet_tx);
            let rtxsig = rtxobj.sig;

            if (this.txmap[rtxsig]) {
              let tweet2 = this.returnTweet(app, this, rtxsig);
              if (tweet2 == null) { return; }
              let tx = tweet2.tx;
              if (!tx.optional) { tx.optional = {}; }
              if (!tx.optional.num_retweets) { tx.optional.num_retweets = 0; }
              tx.optional.num_retweets++;
              this.app.storage.updateTransactionOptional(rtxsig, app.wallet.returnPublicKey(), tx.optional);
              tweet2.renderRetweets();
            } else {
              this.app.storage.incrementTransactionOptionalValue(rtxsig, "num_retweets");
            }
          }
        }
      }

      //
      // add notification for unviewed
      //
      //console.log("ADD THIS: " + tx.transaction.ts + " > " + this.last_viewed_notifications_ts);
      if (tx.transaction.ts > this.last_viewed_notifications_ts) {
        this.addNotification(app, this, tx);
      } else {
        this.ntfs.push(tx);
      }

      this.newTweets.push(tweet);
      if (tx.transaction.from[0].add != app.wallet.returnPublicKey()) {
        document.querySelector("#redsquare-new-tweets-banner").style.display = "block";
      }
      return;
    }



    //
    // servers
    //
    // fetch supporting link properties
    //
    tweet = await tweet.generateTweetProperties(app, this, 1);

    let created_at = tx.transaction.ts;
    let updated_at = tx.transaction.ts;

    //
    // insert the basic information
    //
    let sql = `INSERT INTO tweets (
                tx,
                sig,
            	created_at,
            	updated_at,
            	parent_id,
            	thread_id,
                publickey,
                link,
            	link_properties,
            	num_replies,
            	num_retweets,
            	num_likes,
                has_images,
                tx_size
              ) VALUES (
                $txjson,
                $sig,
            	$created_at,
            	$updated_at,
            	$parent_id,
            	$thread_id,
                $publickey,
            	$link,
            	$link_properties,
            	0,
            	0,
            	0,
                $has_images,
                $tx_size
              )`;

    let has_images = 0;
    if (typeof (tweet.images) != "undefined") { has_images = 1; }
    let txjson = JSON.stringify(tx.transaction);
    let tx_size = txjson.length;

    let params = {
      $txjson: txjson,
      $sig: tx.transaction.sig,
      $created_at: created_at,
      $updated_at: updated_at,
      $parent_id: tweet.parent_id,
      $thread_id: tweet.thread_id,
      $publickey: tx.transaction.from[0].add,
      $link: tweet.link,
      $link_properties: JSON.stringify(tweet.link_properties),
      $has_images: has_images,
      $tx_size: tx_size
    };

    app.storage.executeDatabase(sql, params, "redsquare");

    let ts = new Date().getTime();
    let sql2 = "UPDATE tweets SET updated_at = $timestamp WHERE sig = $sig";
    let params2 = {
      $timestamp: ts,
      $sig: tweet.thread_id,
    }
    app.storage.executeDatabase(sql2, params2, "redsquare");


    if (tweet.retweet_tx != null) {
      let ts = new Date().getTime();
      let sql3 = "UPDATE tweets SET num_retweets = num_retweets + 1 WHERE sig = $sig";
      let params3 = {
        $sig: tweet.thread_id,
      }
      app.storage.executeDatabase(sql3, params3, "redsquare");
    }


    if (tweet.parent_id !== tweet.tx.transaction.sig && tweet.parent_id !== "") {
      let ts = new Date().getTime();
      let sql4 = "UPDATE tweets SET num_replies = num_replies + 1 WHERE sig = $sig";
      let params4 = {
        $sig: tweet.parent_id,
      }
      app.storage.executeDatabase(sql4, params4, "redsquare");
    }

    this.sqlcache = [];

    return;

  }

  sendFlagTransaction(app, mod, data) {

    let redsquare_self = this;

    let obj = {
      module: redsquare_self.name,
      request: "flag tweet",
      data: {},
    };
    for (let key in data) {
      obj.data[key] = data[key];
    }

    let newtx = redsquare_self.app.wallet.createUnsignedTransaction();
    newtx.msg = obj;
    newtx = redsquare_self.app.wallet.signTransaction(newtx);
    redsquare_self.app.network.propagateTransaction(newtx);

    return newtx;

  }

  async receiveFlagTransaction(blk, tx, conf, app) {

    //
    // browsers
    //
    if (app.BROWSER == 1) {
      return;
    }

    //
    // servers
    //
    let txmsg = tx.returnMessage();
    let sql = `UPDATE tweets SET flagged = 1 WHERE sig = $sig`;
    let params = {
      $sig: txmsg.data.sig,
    };
    app.storage.executeDatabase(sql, params, "redsquare");

    this.sqlcache = [];

    return;

  }

  loadRedSquare() {

    if (this.app.options.redsquare) {
      this.redsquare = this.app.options.redsquare;
      if (this.redsquare.last_viewed_notifications_ts) {
        this.last_viewed_notifications_ts = this.redsquare.last_viewed_notifications_ts;
      }
      return;
    }

    this.redsquare = {};
    this.redsquare.last_checked_notifications_timestamp = new Date().getTime();
    this.redsquare.last_viewed_notifications_ts = 0;
    this.redsquare.last_liked_tweets = [];
  }

  saveRedSquare() {
    this.redsquare.last_viewed_notifications_ts = this.last_viewed_notifications_ts;
    this.app.options.redsquare = this.redsquare;
    this.app.storage.saveOptions();
  }
}

module.exports = RedSquare;

