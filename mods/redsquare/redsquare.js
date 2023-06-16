const saito = require("./../../lib/saito/saito");
const ModTemplate = require('../../lib/templates/modtemplate');
const SaitoHeader = require('../../lib/saito/ui/saito-header/saito-header');
const SaitoMain = require("./lib/main");
const SaitoMenu = require("./lib/menu");
const RedSquareSidebar = require("./lib/sidebar");
const Tweet = require("./lib/tweet");
const fetch = require('node-fetch');
const HTMLParser = require('node-html-parser');
const prettify = require('html-prettify');
const redsquareHome = require("./index");
const Post = require("./lib/post");

/*
 * lib/main.js:    this.app.connection.on("redsquare-home-render-request", () => {			// renders main tweets
 * lib/main.js:    this.app.connection.on("redsquare-home-loader-render-request", () => {		// renders loader (home)
 * lib/main.js:    this.app.connection.on("redsquare-home-loader-hide-request", () => {			// hides loader (home)
 * lib/main.js:    this.app.connection.on("redsquare-home-thread-render-request", (tweets) => {		// renders thread (tweets = array)
 * lib/main.js:    this.app.connection.on("redsquare-home-tweet-render-request", (tweet) => {		// renders tweet
 * lib/main.js:    this.app.connection.on("redsquare-home-tweet-append-render-request", (tweet) => {	// appends tweet to home
 * lib/main.js:    this.app.connection.on("redsquare-home-tweet-prepend-render-request", (tweet) => {	// prepends tweet to home
 * lib/main.js:    this.app.connection.on("redsquare-tweet-added-render-request", (tweet) => {		// runs when tweet is added in redsquare
 * lib/main.js:    this.app.connection.on("redsquare-profile-render-request", () => {			// renders profile
 * lib/main.js:    //this.app.connection.on("redsquare-contacts-render-request", () => {		// renders contacts
 * lib/main.js:    this.app.connection.on("redsquare-notifications-render-request", () => {		// renders notifications
 * lib/main.js:    this.app.connection.on("redsquare-component-render-request", (obj) => {		// renders other modules into .saito-main 
 */

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
    this.viewing = "home";
    this.profiles = {};
    this.tweets = [];
    this.tweets_sigs_hmap = {};
    this.unknown_children = [];

    //
    // cache common queries
    //
    this.sqlcache_enabled = 1;

    this.peers = [];
    this.peers_for_tweets = [];
    this.peers_for_notifications = [];

    this.notifications = [];
    this.notifications_sigs_hmap = {};
    this.lastest_tweets = []
    //  
    // view tweet or cache it for "load more"...
    //
    this.tweets_last_viewed_ts = 0;

    //
    // is this a notification?
    //
    this.notifications_last_viewed_ts = 0;
    this.notifications_number_unviewed = 0;
    this.ntfs = []; // notifications, the notifications panel is attached under the full name by subcomponent
    this.ntfs_num = 0;
    this.max_ntfs_num = 50
    this.ntfs_counter = {}

    //
    // used to fetch more content
    //
    this.increment_for_tweets = 0; // start a 0
    this.increment_for_notifications = 1;
    this.results_per_page = 10;
    this.results_loaded = false;
    //
    // tracking timestamps of notifications and tweets (potentially useful)
    //
    this.notifications_newest_ts = 0;
    this.notifications_oldest_ts = new Date().getTime();
    this.tweets_newest_ts = 0;
    this.tweets_oldest_ts = new Date().getTime();

    this.load_more_tweets = 1;
    this.load_more_notifications = 1;
    this.trackedTweet = null
    this.allowed_upload_types = ['image/png', 'image/jpg', 'image/jpeg'];

    this.scripts = [
      '/saito/lib/virtual-bg/virtual-bg.js'
    ]

    this.postScripts = [
      '/saito/lib/emoji-picker/emoji-picker.js',
    ];

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

    this.theme_options = {
      'lite': 'fa-solid fa-sun',
      'dark': 'fa-solid fa-moon'
    };

    return this;

  }


  returnServices() {
    let services = [];
    services.push({ service: "redsquare", name: "RedSquare Tweet Archive" });
    return services;
  }



  /////////////////////////////////
  // inter-module communications //
  /////////////////////////////////
  respondTo(type = "", obj) {
    this_mod = this;
    if (type === 'user-menu') {
      return {
        text: `View ${(obj?.publickey && obj.publickey === this.app.wallet.returnPublicKey())?"My ":""}Profile`,
        icon: "fa fa-user",
        callback: function (app, publickey) {
          if (app.modules.returnActiveModule().returnName() == "Red Square"){
            app.connection.emit('redsquare-profile-render-request', publickey);
          }else{
            window.location = `/redsquare/?user_id=${publickey}`;
          }
          
        }
      }
    }
    if (type === 'saito-header') {
      let x = [];
      if (!this.browser_active){
        x.push({
          text: "RedSquare",
          icon: "fa-solid fa-square",
          rank: 20,
          callback: function (app, id) {
            window.location = "/redsquare";
          }
        });
      }

      if (this.app.browser.isMobileBrowser()) {
        x.push({
          text: "Notifications",
          icon: "fas fa-bell",
          rank: 23,
          callback: function (app, id) {
            if (app.modules.returnActiveModule().returnName() == "Red Square"){
              document.querySelector(".redsquare-menu-notifications").click();
            }else{
              window.location = "/redsquare#notifications";
            }
          }
        });
        x.push({
          text: "Profile",
          icon: "fas fa-user",
          rank: 26,
          callback: function (app, id) {
            if (app.modules.returnActiveModule().returnName() == "Red Square"){
              document.querySelector(".redsquare-menu-profile").click();
            }else{
              window.location = "/redsquare#profile";
            }
          }
        });
      }

      return x;
    }


    if (type === 'saito-floating-menu') {
      let x = [];
      x.push({
        text: "Tweet",
        icon: "fa-solid fa-pen",
        allowed_mods: ['redsquare'],
        disallowed_mods: ['arcade'],
        rank: 10,
        callback: function (app, id) {
          let post = new Post(app, this_mod);
          post.render();
        }
      });

      x.push({
        text: "Tweet Image",
        icon: "fa-solid fa-image",
        allowed_mods: ['redsquare'],
        disallowed_mods: ['arcade'],
        rank: 20,
        callback: function (app, id) {
          post.render();
          post.triggerClick("#hidden_file_element_tweet-overlay");
        }
      });

      return x;
    }

    return null;

  }


  //////////////////////////////
  // initialization functions //
  //////////////////////////////
  //
  // this gets the party started. note that we may not have
  // any network connections to peers at this point. so most
  // of the work is setting up the wallet and seeing if we 
  // already have data there to load.
  //
  // we can also try to load content from any local storage
  // so that we have something to show before the network is
  // live.
  //
  initialize(app) {

    let redsquare_self = app.modules.returnModule('RedSquare');
    super.initialize(app);

    //
    // fetch content from options file
    //
    this.load();

    //
    // this prints the last 10 tweets to ./web/tweets.js which is optionally
    // fetched by browsers. It allows us to rapidly put the last 10 tweets we
    // prefer at the top of their feed for more rapid page load.
    //
    if (app.BROWSER == 0) {
      this.updateTweetsCacheForBrowsers();
    }

  }


  //
  // this initializes the DOM but does not necessarily show the loaded content 
  // onto the page, as we are likely being asked to render the components on 
  // the application BEFORE we have any peers capable of feeding us content.
  //
  render() {

    if (this.app.BROWSER == 1) {
      if (this.app.options.theme) {
        let theme = this.app.options.theme[this.slug];
        if (theme != null) {
          this.app.browser.switchTheme(theme);
        }
      }
    }

    if (this.main == null) {

      this.main = new SaitoMain(this.app, this);
      this.header = new SaitoHeader(this.app, this);
      this.menu = new SaitoMenu(this.app, this, '.saito-sidebar.left');
      this.sidebar = new RedSquareSidebar(this.app, this, '.saito-sidebar.right');

      this.addComponent(this.header);
      this.addComponent(this.main);
      this.addComponent(this.menu);
      this.addComponent(this.sidebar);

      //
      // chat manager can insert itself into left-sidebar if exists
      //
      this.app.modules.returnModulesRespondingTo("chat-manager").forEach((mod) => {
        let cm = mod.respondTo("chat-manager");
        cm.container = ".saito-sidebar.left";
        cm.render_manager_to_screen = 1;
        this.addComponent(cm);
      });

    }

    super.render();

  }


  //
  // runs when archive peer connects
  //
  async onPeerServiceUp(app, peer, service = {}) {

    //
    // avoid network overhead if in other apps
    //
    if (!this.browser_active) { return; }


    //
    // redsquare -- load tweets
    //
    if (service.service === "redsquare") {

      //
      // render tweet + children
      //
      let tweet_id = this.app.browser.returnURLParameter('tweet_id');
console.log("TWEET ID");
      if (tweet_id != "") {
        let sql = `SELECT * FROM tweets WHERE sig = '${tweet_id}' OR parent_id = '${tweet_id}' ORDER BY created_at DESC`;
console.log("TWEET ID 2");
        this.loadTweetsFromPeer(peer, sql, (txs) => {
console.log("TWEET ID 3");
          for (let z = 0; z < txs.length; z++) { this.addTweet(txs[z]); }
  	  let tweet = this.returnTweet(tweet_id);
console.log("TWEET ID 4");
          this.app.connection.emit('redsquare-home-tweet-render-request', tweet);
console.log("TWEET ID 5");
        });
        return;
      }

      //
      // render user profile
      //
      let user_id = this.app.browser.returnURLParameter('user_id');
console.log("uSER ID");
      if (user_id != "") {
console.log("uSER ID 2");
        this.app.connection.emit("redsquare-profile-render-request", (user_id));
        return;
      }

      //
      // or fetch tweets
      //
      this.addPeer(peer, "tweets");
      this.loadTweets(peer, () => {
	this.app.connection.emit("redsquare-home-render-request");
      });
    }

    //
    // archive -- load notifications
    //
    if (service.service === "archive") {
      this.addPeer(peer, "notifications");
      setTimeout(() => { 
	this.loadNotifications(peer, () => {
        });
      }, 3500);
    }

  }


  //
  // runs when normal peer connects
  //
  async onPeerHandshakeComplete(app, peer) {

    //
    // avoid network overhead if in other apps
    //
    if (!this.browser_active) { return; }

    //
    // render tweet thread
    //

    //
    // render user profile
    //

  }


  //
  // adds peer to list of content sources
  //
  addPeer(peer, type="tweets") {

    let has_tweets = false;
    let has_notifications = false;

    if (type === "tweets") { has_tweets = true; }
    if (type === "notifications") { has_notifications = true; }

    let peer_idx = -1;
    for (let i = 0; i < this.peers.length; i++) {
      if (this.peers[i].publickey == peer.returnPublicKey()) { peer_idx = i; }
    }
    if (peer_idx == -1) {
      this.peers.push({
	peer : peer , 
	publickey : peer.returnPublicKey() , 
	tweets_earliest_ts : 0 ,
	tweets_latest_ts : 0 ,
	tweets_limit : 20 ,
	profile_earliest_ts : 0 ,
	profile_latest_ts : 0 ,
	profile_limit : 20 ,
	notifications_earliest_ts : 0 ,
	notifications_latest_ts : 0 ,
	notifications_limit : 10 ,
	has_tweets : has_tweets ,
	has_notifications : has_notifications 
      });
    } else {
      this.peers[peer_idx].peer = peer;
      if (has_tweets) { this.peers[peer_idx].tweets = true; }
      if (has_notifications) { this.peers[peer_idx].notifications = true; }
    }

  }

  updatePeerEarliestTweetTimestamp(peer=null, ts) {
    if (peer == null) {
      for (let i = 0; i < this.peers.length; i++) {
        this.peers[i].tweets_earliest_ts = ts;
      }
    } else {
      for (let i = 0; i < this.peers.length; i++) {
        if (this.peers[i].peer == peer) {
	  this.peers[i].tweets_earliest_ts = ts;
        }
      }
    }
  }

  updatePeerEarliestProfileTimestamp(peer=null, ts) {
    if (peer == null) {
      for (let i = 0; i < this.peers.length; i++) {
        this.peers[i].profile_earliest_ts = ts;
      }
    } else {
      for (let i = 0; i < this.peers.length; i++) {
        if (this.peers[i].peer == peer) {
	  this.peers[i].profile_earliest_ts = ts;
        }
      }
    }
  }

  updatePeerEarliestNotificationTimestamp(peer=null, ts) {
    if (peer == null) {
      for (let i = 0; i < this.peers.length; i++) {
        this.peers[i].notification_earliest_ts = ts;
      }
    } else {
      for (let i = 0; i < this.peers.length; i++) {
        if (this.peers[i].peer == peer) {
	  this.peers[i].notification_earliest_ts = ts;
        }
      }
    }
  }


  returnEarliestTimestampFromTransactionArray(txs = []) {
    let ts = 0;
    for (let i = 0; i < txs.length; i++) {
      if (txs[i].transaction.ts < ts || ts == 0) { ts = txs[i].transaction.ts; }
    }
    return ts;
  }


  ///////////////////////
  // network functions //
  ///////////////////////
  async onConfirmation(blk, tx, conf, app) {

    let txmsg = tx.returnMessage();
    try {
      if (conf == 0) {
        if (txmsg.request === "create tweet") {
          this.receiveTweetTransaction(blk, tx, conf, app);
          this.sqlcache = {};
        }
        if (txmsg.request === "like tweet") {
          this.receiveLikeTransaction(blk, tx, conf, app);
          this.sqlcache = {};
        }
        if (txmsg.request === "flag tweet") {
          this.receiveFlagTransaction(blk, tx, conf, app);
          this.sqlcache = {};
        }
      }
    } catch (err) {
      console.log("ERROR in " + this.name + " onConfirmation: " + err);
    }
  }



  ///////////////////////////////
  // content loading functions //
  ///////////////////////////////
  //
  // NOTE - we are ignoring PEER here and making request of ALL peers
  // but am leaving function name intact in case we want to add a meta-layer
  // that discriminates.
  //
  loadProfileTweets(peer, publickey="", mycallback) {

    for (let i = 0; i < this.peers.length; i++) {

      let peer = this.peers[i].peer;
      if (this.peers[i].tweets_earliest_ts == 0) { this.peers[i].tweets_earliest_ts = new Date().getTime(); }

      let sql = `SELECT * FROM tweets WHERE publickey = '${publickey}' AND updated_at < ${this.peers[i].profile_earliest_ts} ORDER BY created_at DESC LIMIT '${this.peers[i].profile_limit}'`;
      this.loadTweetsFromPeer(peer, sql, (txs) => {
        for (let z = 0; z < txs.length; z++) { this.addTweet(txs[z]); }
	this.updatePeerEarliestProfileTimestamp(peer, this.returnEarliestTimestampFromTransactionArray(txs));
        if (mycallback) {
          mycallback(txs)
        }
      });
    }
  }

  loadTweets(peer, mycallback) {

    for (let i = 0; i < this.peers.length; i++) {

      let peer = this.peers[i].peer;
      if (this.peers[i].tweets_earliest_ts == 0) { this.peers[i].tweets_earliest_ts = new Date().getTime(); }

      let sql = `SELECT * FROM tweets WHERE parent_id = "" AND flagged IS NOT 1 AND moderated IS NOT 1 AND tx_size < 10000000 AND updated_at < ${this.peers[i].tweets_earliest_ts} ORDER BY updated_at DESC LIMIT '${this.peers[i].tweets_limit}'`;

      this.loadTweetsFromPeer(peer, sql, (txs) => {
        for (let z = 0; z < txs.length; z++) { this.addTweet(txs[z]); }
	this.updatePeerEarliestTweetTimestamp(peer, this.returnEarliestTimestampFromTransactionArray(txs));
        if (mycallback) {
          mycallback(txs)
        }
      });
    }
  }

  loadTweetChildren(peer, sig, mycallback = null) {

    if (this.peers.length == 0) { return; }
    if (mycallback == null) { return; }

    for (let i = 0; i < this.peers.length; i++) {

      let peer = this.peers[i].peer;

      let x = [];
      let sql = `SELECT * FROM tweets WHERE parent_id = '${sig}' ORDER BY created_at DESC`;

      this.loadTweetsFromPeer(this.peers[0].peer, sql, (txs) => {
        for (let z = 0; z < txs.length; z++) { this.addTweet(txs[z]); }
        if (mycallback) {
          mycallback(txs)
        }
      });
    }
  }

  loadTweetWithSig(sig, mycallback = null) {

    if (this.peers.length == 0) { return; }
    if (mycallback == null) { return; }

    let t = this.returnTweet(sig);
    if (t != null) { mycallback(t); return; }

    let sql = `SELECT * FROM tweets WHERE sig = '${sig}' ORDER BY created_at DESC`;
    this.loadTweetsFromPeer(this.peers[0].peer, sql, (txs) => {
      for (let z = 0; z < txs.length; z++) { this.addTweet(txs[z]); }
      if (mycallback) {
        mycallback(txs)
      }
    });
  }

  loadTweetsFromPeer(peer, sql, mycallback = null) {
    let txs = [];
console.log("LTFPAR...");
    this.loadTweetsFromPeerAndReturn(peer, sql, (txs, tweet_to_track = null) => {
console.log("LTFPAR 2...");
      for (let z = 0; z < txs.length; z++) { this.addTweet(txs[z]); }
      if (mycallback != null) { mycallback(txs); }
    });
  }

  loadTweetsFromPeerAndReturn(peer, sql, mycallback = null) {

    let txs = [];
    let tweet_to_track = null;

    this.sendPeerDatabaseRequestWithFilter(
      "RedSquare",
      sql,
      async (res) => {
        if (res.rows) {

	  this.addPeer(peer, "tweet");

          res.rows.forEach(row => {
            let tx = new saito.default.transaction();
            tx.deserialize_from_web(this.app, row.tx);
            if (!tx.optional) { tx.optional = {}; }
            tx.optional.parent_id = tx.msg.parent_id;
            tx.optional.thread_id = tx.msg.thread_id;
            tx.optional.num_replies = row.num_replies;
            tx.optional.num_retweets = row.num_retweets;
            tx.optional.num_likes = row.num_likes;
            tx.optional.flagged = row.flagged;
            tx.optional.link_properties = {};
            try {
              let x = JSON.parse(row.link_properties);
              tx.optional.link_properties = x;
            } catch (err) { }
            // this will render the event
            txs.push(tx);
          });
        }
console.log("LTFPAR pre callback...");
        if (mycallback != null) { mycallback(txs); }
      },
      (p) => { if (p == peer) { return 1; } return 0; }
    );
  }


  //
  // NOTE - we are ignoring PEER here and making request of ALL peers
  // but am leaving function name intact in case we want to add a meta-layer
  // that discriminates.
  //
  loadNotifications(peer, mycallback=null) {

    //
    // tweets are fetched from a special SQL table maintained by servers, and potentially
    // in the future from the Archives of peers, but Notifications are always fetched as 
    // transactions.
    //
    for (let i = 0; i < this.peers.length; i++) {

      let peer = this.peers[i].peer;

      this.app.storage.loadTransactions(
        {
	  field3 : this.app.wallet.returnPublicKey() ,
	  limit : this.peers[i].limit ,
  	  offset : this.peers[i].offset ,
        },
        (txs) => { 
          if (txs.length > 0) {
            for (let z = 0; z < txs.length; z++) { 
              txs[z].decryptMessage(this.app);
	      this.addTweet(txs[z]);
	    }
          }
	  this.updatePeerEarliestProfileTimestamp(peer, this.returnEarliestTimestampFromTransactionArray(txs));
          if (mycallback) {
            mycallback(txs)
          }
        },
        this.peers[i].peer
      );

      this.peers[i].offset += this.peers[i].limit;
    }

  }






  loadTweetsWithParentId(sig, mycallback = null) {

    if (this.peers.length == 0) { return; }
    if (mycallback == null) { return; }

    let t = this.returnTweet(sig);
    if (t != null) {
      let x = [];
      for (let z = 0; z < t.children.length; z++) {
        x.push(t.children[z]);
      }
      mycallback(x);
      return;
    }

    let sql = `SELECT * FROM tweets WHERE parent_id = '${sig}' ORDER BY created_at DESC`;
    this.loadTweetsFromPeer(mod.peers[0].peer, sql, (txs) => {
      let x = [];
      //this.loadTweetsFromPeerAndReturn(peer, sql, (txs) => {
      this.loadTweetsFromPeer(peer, sql, (txs) => {
        for (let z = 0; z < txs.length; z++) {
          let tweet = new Tweet(app, mod, ".tweet-manager", txs[z]);
          x.push(tweet);
        }
        mycallback(x);
      }, false, false);
      return;
    });

  }


  //
  // adds tweets to internal data structure
  //
  // notifications are added through this function. 
  //
  addTweet(tx, prepend = false) {

    //
    // create the tweet
    //
    let tweet = new Tweet(this.app, this, ".tweet-manager", tx);

    tweet.updated_at = tx.transaction.ts;

    let is_notification = 0;

    //
    // maybe this needs to go into notifications too
    //
    if (tx.isTo(this.app.wallet.returnPublicKey())) {

      //
      // this is a notification, so update our timestamps
      //
      if (tx.transaction.ts > this.notifications_newest_ts) {
        this.notifications_newest_ts = tx.transaction.ts;
      }
      if (tx.transaction.ts < this.notifications_oldest_ts) {
        this.notifications_oldest_ts = tx.transaction.ts;
      }
      //
      // notify of other people's actions, but not ours
      //
      if (!tx.isFrom(this.app.wallet.returnPublicKey())) {

        let insertion_index = 0;
        if (prepend == false) {
          for (let i = 0; i < this.notifications.length; i++) {
            if (this.notifications[i].updated_at > tweet.updated_at) {
              insertion_index++;
              break;
            } else {
              insertion_index++;
            }
          }
        }

        is_notification = 1;
        this.notifications.splice(insertion_index, 0, tweet);
        this.notifications_sigs_hmap[tweet.tx.transaction.sig] = 1;

        //
        // increment notifications in menu unless is our own
        //
        if (tx.transaction.ts > this.notifications_last_viewed_ts) {
          this.notifications_number_unviewed = this.notifications_number_unviewed + 1;
          this.menu.incrementNotifications("notifications", this.notifications_number_unviewed);
        }

      }

      //
      // if this is a like, we can avoid adding it to our tweet index
      //
      let txmsg = tx.returnMessage();
      if (txmsg.request === "like tweet") {
        //
        // skip out on likes but still update timestamps
        //
        if (tx.transaction.ts > this.tweets_newest_ts) {
          this.tweets_newest_ts = tx.transaction.ts;
        }
        if (tx.transaction.ts < this.notifications_oldest_ts) {
          this.tweets_oldest_ts = tx.transaction.ts;
        }
        return;
      }
    }

    //
    // if this is a like, we can avoid adding it to our tweet index
    //
    let txmsg = tx.returnMessage();
    if (txmsg.request === "like tweet") {
      return;
    }

    //
    // add tweet to tweet and tweets_sigs_hmap for easy-reference
    //
    //
    // this is a post
    //
    if (tweet.tx.optional.parent_id === "") {

      //
      // we do not have this tweet indexed, it's new
      //
      if (!this.tweets_sigs_hmap[tweet.tx.transaction.sig]) {

        //
        // check where we insert the tweet
        //
        let insertion_index = 0;
        if (prepend == false) {
          for (let i = 0; i < this.tweets.length; i++) {
            if (this.tweets[i].updated_at > tweet.updated_at) {
              insertion_index++;
              break;
            } else {
              //insertion_index++;
            }
          }
        }

        //
        // add unknown children if possible
        //
        for (let i = 0; i < this.unknown_children.length; i++) {
          if (this.unknown_children[i].tx.optional.thread_id === tweet.tx.transaction.sig) {
console.log("insertion index is: " + insertion_index);
console.log("i is: " + i);
console.log(this.tweets.length + " -- and -- " + this.unknown_children.length);
	    if (this.tweets.length > insertion_index) {
              if (this.tweets[insertion_index].addTweet(this.unknown_children[i]) == 1) {
                this.unknown_children.splice(i, 1);
                i--;
              }
            }
          }
        }

        //
        // and insert it
        //
        this.tweets.splice(insertion_index, 0, tweet);
        this.tweets_sigs_hmap[tweet.tx.transaction.sig] = 1;


      } else {

        for (let i = 0; i < this.tweets.length; i++) {
          if (this.tweets[i].tx.transaction.sig === tweet.tx.transaction.sig) {
            this.tweets[i].tx.optional.num_replies = tweet.num_replies;
            this.tweets[i].tx.optional.num_retweets = tweet.num_retweets;
            this.tweets[i].tx.optional.num_likes = tweet.num_likes;
          }
        }
      }

      //
      // this is a comment
      //
    } else {

      let inserted = false;

      for (let i = 0; i < this.tweets.length; i++) {
        if (this.tweets[i].tx.transaction.sig === tweet.tx.optional.thread_id) {
          if (this.tweets[i].addTweet(tweet) == 1) {
            this.tweets_sigs_hmap[tweet.tx.transaction.sig] = 1;
            inserted = true;
            break;
          }
        }
      }

      if (inserted == false) {
        this.unknown_children.push(tweet);
      }

    }

    //
    // this is a tweet, so update our info
    //
    if (is_notification == 0) {
      if (tx.transaction.ts > this.tweets_newest_ts) {
        this.tweets_newest_ts = tx.transaction.ts;
      }
      if (tx.transaction.ts < this.notifications_oldest_ts) {
        this.tweets_oldest_ts = tx.transaction.ts;
      }
    }

  }





  returnTweet(tweet_sig = null) {

    if (tweet_sig == null) { return null; }
    if (!this.tweets_sigs_hmap[tweet_sig]) {
      return null;
    }

    for (let i = 0; i < this.tweets.length; i++) {
      if (this.tweets[i].tx.transaction.sig === tweet_sig) {
        return this.tweets[i];
      }
      if (this.tweets[i].hasChildTweet(tweet_sig)) {
        return this.tweets[i].returnChildTweet(tweet_sig);
      }
    }

    return null;

  }


  async fetchOpenGraphProperties(app, mod, link) {

    if (app.BROWSER != 1) {

      // fetch source code for link inside tweet
      // (sites which uses firewall like Cloudflare shows Cloudflare loading
      //  page when fetching page source)
      //
      try {
        return fetch(link, {follow: 10})
          .then(res => res.text())
          .then(data => {

            // required og properties for link preview
            let og_tags = {
              'og:exists': false,
              'og:title': '',
              'og:description': '',
              'og:url': '',
              'og:image': '',
              'og:site_name': ''
            };


            // prettify html - unminify html if minified
            let html = prettify(data);

            // parse string html to DOM html
            let dom = HTMLParser.parse(html);

            // fetch meta element for og tags
            let meta_tags = dom.getElementsByTagName('meta');

            // loop each meta tag and fetch required og properties
            for (let i = 0; i < meta_tags.length; i++) {
              let property = meta_tags[i].getAttribute('property');
              let content = meta_tags[i].getAttribute('content');
              // get required og properties only, discard others
              if (property in og_tags) {
                og_tags[property] = content;
                og_tags['og:exists'] = true;
              }
            }

            return og_tags;
          });
      } catch (err) {
        return {};
      }
    } else {
      return {};
    }
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
        if (this.tweets_sigs_hmap[txmsg.data.sig]) {
          let tweet = this.returnTweet(txmsg.data.sig);
          if (tweet == null) { return; }
          let tx = tweet.tx;
          if (!tx.optional) { tx.optional = {}; }
          if (!tx.optional.num_likes) { tx.optional.num_likes = 0; }
          tx.optional.num_likes++;
          this.app.storage.updateTransaction(tx, { field1 : "RedSquare" }, "localhost");
          tweet.renderLikes();
        } else {
          this.app.storage.updateTransaction(tx, { field1 : "RedSquare" }, "localhost");
        }

        //
        // convert like into tweet and addTweet to get notifications working
        //
        this.addTweet(tx, true);


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
    await app.storage.executeDatabase(sql, params, "redsquare");


    //
    // update cache
    //
    this.updateTweetsCacheForBrowsers();

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

    try {

      let tweet = new Tweet(app, this, "", tx);
      let txmsg = tx.returnMessage();

  
      //
      // browsers
      //
      if (app.BROWSER == 1) {

        //
        // save tweets addressed to me
        //
        if (tx.isTo(app.wallet.returnPublicKey())) {

          this.app.storage.saveTransaction(tx, { field1 : "RedSquare" }, "localhost");

          //
          // if replies
          //
          if (txmsg.data?.parent_id) {
            if (this.tweets_sigs_hmap[txmsg.data.parent_id]) {
              let tweet = this.returnTweet(txmsg.data.parent_id);
              if (tweet == null) { return; }
      	      if (!tweet.tx.optional) { tweet.tx.optional = {}; }
              if (!tweet.tx.optional.num_replies) { tweet.tx.optional.num_replies = 0; }
              tx.optional.num_replies++;
              this.app.storage.updateTransaction(tx, { field1 : "RedSquare" }, "localhost");
              tweet.renderReplies();
            } else {
              this.app.storage.updateTransaction(tx, { field1 : "RedSquare" }, "localhost");
            }
          }

          //
          // if retweets
          //
          if (txmsg.data?.retweet_tx) {
            if (txmsg.data?.retweet_tx) {
              let rtx = new saito.default.transaction();
              rtx.deserialize_from_web(this.app, txmsg.data.retweet_tx);
              let rtxsig = rtxobj.sig;

              if (this.tweets_sigs_hmap[rtxsig]) {
                let tweet2 = this.returnTweet(rtxsig);
                if (tweet2 == null) { return; }
                let tx = tweet2.tx;
                if (!tx.optional) { tx.optional = {}; }
                if (!tx.optional.num_retweets) { tx.optional.num_retweets = 0; }
                tx.optional.num_retweets++;
                this.app.storage.updateTransaction(tx, { field1 : "RedSquare" }, "localhost");
                tweet2.renderRetweets();
              } else {
                this.app.storage.updateTransaction(tx, { field1 : "RedSquare" }, "localhost");
              }
            }
          }
        }

        this.addTweet(tx, 1);
        return;

      }


      //
      // servers
      //
      // fetch supporting link properties
      //
      //console.log("SERVER FETCHING OPEN GRAPH PROPERTIES!");
      //console.log("this is for: " + tweet.text);
      tweet = await tweet.generateTweetProperties(app, this, 1);
      //console.log("DONE: " + JSON.stringify(tweet.link_properties));


      let type_of_tweet = 0; // unknown
      if (txmsg.data?.parent_id) {
        type_of_tweet = 1; // reply
      }
      if (txmsg.data?.retweet_tx) {
        type_of_tweet = 2; // retweet
      }
      if (tweet.link != null) {
        type_of_tweet = 3; // link
      }
      if (tweet.images?.length > 0) {
        type_of_tweet = 4; // images
      }

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
                type,
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
            	$type,
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
      let txjson = tx.serialize_to_web(this.app);
      let tx_size = txjson.length;

      let params = {
        $txjson: txjson,
        $sig: tx.transaction.sig,
        $created_at: created_at,
        $updated_at: updated_at,
        $parent_id: tweet.tx.optional.parent_id,
        $type: type_of_tweet,
        $thread_id: tweet.tx.optional.thread_id,
        $publickey: tx.transaction.from[0].add,
        $link: tweet.link,
        $link_properties: JSON.stringify(tweet.tx.optional.link_properties),
        $has_images: has_images,
        $tx_size: tx_size
      };

      await app.storage.executeDatabase(sql, params, "redsquare");

      let ts = new Date().getTime();
      let sql2 = "UPDATE tweets SET updated_at = $timestamp WHERE sig = $sig";
      let params2 = {
        $timestamp: ts,
        $sig: tweet.thread_id,
      }
      await app.storage.executeDatabase(sql2, params2, "redsquare");

      if (tweet.retweet_tx != null) {
        let ts = new Date().getTime();
        let sql3 = "UPDATE tweets SET num_retweets = num_retweets + 1 WHERE sig = $sig";
        let params3 = {
          $sig: tweet.thread_id,
        }
        await app.storage.executeDatabase(sql3, params3, "redsquare");
      }

      if (tweet.parent_id !== tweet.tx.transaction.sig && tweet.parent_id !== "") {
        let ts = new Date().getTime();
        let sql4 = "UPDATE tweets SET num_replies = num_replies + 1 WHERE sig = $sig";
        let params4 = {
          $sig: tweet.parent_id,
        }
        await app.storage.executeDatabase(sql4, params4, "redsquare");
      }


      //
      // update cache
      //
      this.updateTweetsCacheForBrowsers();

      this.sqlcache = [];

      return;

    } catch (err) {
      console.log("ERROR in receiveTweetsTransaction() in RedSquare: " + err);
    }

  }

  //
  // writes the latest 10 tweets to tweets.js
  //
  async updateTweetsCacheForBrowsers() {

    let hex_entries = [];

    let sql = `SELECT * FROM tweets WHERE (flagged IS NOT 1 AND moderated IS NOT 1) AND (((num_replies > 0 OR num_likes > 0) AND parent_id IS NOT "") OR (parent_id IS "")) AND (sig IN (SELECT sig FROM tweets WHERE parent_id = "" AND flagged IS NOT 1 AND moderated IS NOT 1 AND tx_size < 10000000 ORDER BY updated_at DESC LIMIT 10)) OR (thread_id IN (SELECT sig FROM tweets WHERE parent_id = "" AND flagged IS NOT 1 AND moderated IS NOT 1 AND tx_size < 10000000 ORDER BY updated_at DESC LIMIT 10)) ORDER BY created_at ASC LIMIT 20`;
    let params = {};
    let rows = await this.app.storage.queryDatabase(sql, params, "redsquare");

    for (let i = 0; i < rows.length; i++) {

      //
      // create the transaction
      //
      let tx = new saito.default.transaction();
      tx.deserialize_from_web(this.app, rows[i].tx);
      if (rows[i].num_reples) { tx.optional.num_replies = rows[i].num_replies; }
      if (rows[i].num_retweets) { tx.optional.num_retweets = rows[i].num_retweets; }
      if (rows[i].num_likes) { tx.optional.num_likes = rows[i].num_likes; }
      if (rows[i].flagged) { tx.optional.flagged = rows[i].flagged; }
      let hexstring = tx.serialize_to_web(this.app);
      hex_entries.push(hexstring);

    }


    try {

      let path = this.app.storage.returnPath();
      if (!path) { return; }

      const filename = path.join(__dirname, 'web/tweets.');
      let fs = this.app.storage.returnFileSystem();
      let html = `if (!tweets) { var tweets = [] };`;
      if (fs != null) {

        for (let i = 0; i < hex_entries.length; i++) {
          let thisfile = filename + i + ".js"
          const fd = fs.openSync(thisfile, "w");
          html += `  tweets.push(\`${hex_entries[i]}\`);   `;
          fs.writeSync(fd, html);
          fs.fsyncSync(fd);
          fs.closeSync(fd);
          html = "";
        }
      }
    } catch (err) {
      console.error("ERROR 2832329: error tweet cache to disk. ", err);
    }
    return "";
  

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
    await app.storage.executeDatabase(sql, params, "redsquare");

    this.sqlcache = [];

    //
    // update cache
    //
    this.updateTweetsCacheForBrowsers();

    return;

  }



  /////////////////////////////////////
  // saving and loading wallet state //
  /////////////////////////////////////
  load() {

    if (this.app.options.redsquare) {
      this.redsquare = this.app.options.redsquare;
      this.notifications_last_viewed_ts = this.redsquare.notifications_last_viewed_ts;
      this.notifications_number_unviewed = this.redsquare.notifications_number_unviewed;
    } else {
      this.redsquare = {};
      this.notifications_last_viewed_ts = new Date().getTime();
      this.notifications_number_unviewed = 0;
      this.save();
    }
  }

  save() {
    this.redsquare.notifications_last_viewed_ts = this.notifications_last_viewed_ts;
    this.redsquare.notifications_number_unviewed = this.notifications_number_unviewed;
    this.app.options.redsquare = this.redsquare;
    this.app.storage.saveOptions();
  }



  webServer(app, expressapp, express) {

    let webdir = `${__dirname}/../../mods/${this.dirname}/web`;
    let fs = app?.storage?.returnFileSystem();
    let redsquare_self = this;

    expressapp.get('/' + encodeURI(this.returnSlug()), async function (req, res) {

      let reqBaseURL = req.protocol + "://" + req.headers.host + "/";

      try {

        if (Object.keys(req.query).length > 0) {
          let query_params = req.query;

          if (typeof query_params.tweet_id != "undefined" || typeof query_params.thread_id != "undefined") {
            let sig = query_params.tweet_id || query_params.thread_id;
            let sql = `SELECT * FROM tweets WHERE sig = '${sig}' ORDER BY created_at DESC`;
            let rows = await app.storage.queryDatabase(sql, {}, "redsquare");

            for (let i = 0; i < rows.length; i++) {
              let tx = new saito.default.transaction();
              tx.deserialize_from_web(app, rows[i].tx);
              let txmsg = tx.returnMessage();
              let text = txmsg.data.text;
              let publickey = tx.transaction.from[0].add;
              let user = app.keychain.returnIdentifierByPublicKey(publickey, true);

              redsquare_self.social.twitter_description = text;
              redsquare_self.social.og_description = text;
              redsquare_self.social.og_url = reqBaseURL + encodeURI(redsquare_self.returnSlug());

              // if (typeof tx.msg.data.images != "undefined") {
              //   let image = tx.msg.data?.images[0];
              // } else {
              //   let publickey = tx.transaction.from[0].add;
              //   let image = app.keychain.returnIdenticon(publickey);
              // }

              let image = redsquare_self.social.og_url = reqBaseURL + encodeURI(redsquare_self.returnSlug()) + '?og_img_sig=' + sig;
              redsquare_self.social.og_title = user + " posted on Saito 🟥";
              redsquare_self.social.twitter_title = user + " posted on Saito 🟥"
              redsquare_self.social.og_image = image;
              redsquare_self.social.og_image_url = image;
              redsquare_self.social.og_image_secure_url = image;
              redsquare_self.social.twitter_image = image;

            }
          }

          if (typeof query_params.og_img_sig != "undefined") {
            console.info(query_params.og_img_sig);

            let sig = query_params.og_img_sig;
            let sql = `SELECT * FROM tweets WHERE sig = '${sig}' ORDER BY created_at DESC`;

            let rows = await app.storage.queryDatabase(sql, {}, "redsquare");
            console.info(rows.length);
            for (let i = 0; i < rows.length; i++) {
              let tx = new saito.default.transaction();
              tx.deserialize_from_web(redsquare_self.app, rows[i].tx);
              //console.info(rows[i]);
              txmsg = tx.returnMessage();
              //console.info(txmsg);
              if (typeof txmsg.data.images != "undefined") {
                let img_uri = txmsg.data?.images[0];
                let img_type = img_uri.substring(img_uri.indexOf(":") + 1, img_uri.indexOf(";"));
                let base64Data = img_uri.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
                let img = Buffer.from(base64Data, 'base64');

              } else {
                let publickey = tx.transaction.from[0].add;
                let img_uri = app.keychain.returnIdenticon(publickey, "png");
                let base64Data = img_uri.replace(/^data:image\/png;base64,/, '');
                let img = Buffer.from(base64Data, 'base64');
                let img_type = img_uri.substring(img_uri.indexOf(":") + 1, img_uri.indexOf(";"));
              }

              if (img_type == 'image/svg+xml') {
                img_type = 'image/svg';
              }

              console.info('### write from 1651 of redsquare.js (request Open Graph Image)');
              res.writeHead(200, {
                'Content-Type': img_type,
                'Content-Length': img.length
              });
              res.end(img);
              return;
            }
          }
        }
      } catch (err) {
        console.log("Loading OG data failed with error: " + err);
      }
      console.info('### write from line 1242 of server.ts.')
      res.setHeader("Content-type", "text/html");
      res.charset = "UTF-8";
      res.send(redsquareHome(app, redsquare_self));
      return;

    });

    expressapp.use('/' + encodeURI(this.returnSlug()), express.static(webdir));
  }

}

module.exports = RedSquare;

