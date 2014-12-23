var dbOptions = ({
  "retryMiliSeconds": 1000,
  "numberOfRetries": 3,
  "native_parser": false, // I believe this is so we use the C++ bson parser (faster)
  "safe": false
});

//var mongo = require('mongodb');

var mongo = require('mongodb'), format = require('util').format;


var MongoClient = mongo.MongoClient
  , Server = mongo.Server;

/*
*  Increasing pool size increase speed to save data in db
*/

module.exports = {
dbServer : function(host , port){
  
  return new mongo.Server(host , port, {
    "auto_reconnect": true,
    "poolSize": 10
  });
},

opened : [],

clientsServer : function(host , port){
  return new mongo.Server(host , port , {
    "auto_reconnect": true,
    "poolSize": 1
  });
},

getDbConnection : function(db_name , host , port ){
  return new mongo.Db(db_name, this.dbServer(host , port), dbOptions);
},

getDbConnectionFromString : function(connection_str, cb_connect){
  MongoClient.connect(connection_str, function(err, db) {
        if(err){ console.log(err); return cb_connect(err) } else {
            return cb_connect('', db);
        }
    });
},

getClientConnection : function(db_name, host , port){
  return new mongo.Db(db_name, this.clientsServer(host , port), dbOptions);
},


/*
* Open connections one by one
*/

openConnections : function(databases , cb){

	console.log(databases);
	var that = this;
	var error = '';
	//var that.opened = null;
	function openMe(db_obj){

		if(db_obj == undefined){
			cb(null); return;
		}
		
		var db_name = db_obj.db_name;
		var db_host = db_obj.db_host;
		var db_port = db_obj.db_port;
		var alias    = db_obj.alias;

		if(db_name == undefined){
			console.log(colors.green('[DB]: all databases are opened'));
			cb(null);
		}else{

			var _dbObj = that.getDbConnection(db_name , db_host , db_port);
		  	_dbObj.open(function (err, opened_db) {
			  	if(err){
			  		cb(true);			  		
			  		console.log(colors.red('[DB] Error : opening '+db_name));
			      	return;
			  	}else{	
			  //	opened[alias] = opened_db;	
			  if(typeof that.opened == 'undefined'){
			  	that['opened'] = [];
			  }
			  		that.opened[alias] = opened_db ;
			  		console.log('[DB]: opened '+db_name+' alias='+alias);
			        openMe(databases.shift());
			  	}
			});
		}
	}	
	openMe(databases.shift()); 
},


/*
* Ensure connections are opened
*/

reopenClosedConnections : function(cb){

	if(conf.debug){
		console.log(colors.yellow('[DB] Reopening closed connections'));
	}	

	var closed = [];
	Object.keys(db.opened).forEach(function(key) {
	    var current_db = db.opened[key];
	    if(current_db.status == 'disconnected'){
	    	closed.push(current_db.databaseName);
	    }
	});

	//reopen closed connections
	if(closed[0] != undefined){
		if(conf.debug){
			console.log(colors.yellow('[Warn] found '+closed.length+' closed connections'));
		}
		this.openConnections(closed , cb);
	}else{
		cb();
	}

},

connectClientServer : function (cb) {
	
	var server_options = {
	      poolSize : 30,
	      auto_reconnect : true,
	      socketOptions: {
	        connectTimeoutMS: 2000,
	      }
	    };
	
	var s = new Server(this.client_host, this.client_port , server_options);
	
	var mongoCl = new MongoClient(s);
	mongoCl.open(function(err, mongoCl) {
		if(err){
			cb(err);
		}else{
			//console.log(mongoCl);
			cb(null , mongoCl);
		}			
	});
},


reopenClientConnections : function(client_db , cb){

	if(client_db.state == 'connected'){
		cb(null); return;
	}

	console.log('trying to reconnect to client server -------->>>>>>>>>>>');

	this.connectClientServer(function(error , MongoCl){
		if(error){
			cb(error);
		}else{

			console.log('reconnected to client server -------->>>>>>>>>>>');
			cb(null , MongoCl);
		}
	});
	

},


openConnectionsNew : function(databases , cb){

	var options = {
	    db: {
	      native_parser: false,
	      wtimeout: 5000
	    },
	    server: {
	      auto_reconnect : true,
	      poolSize : 5
	    }
	};

	var that = this;
	var error = '';

	function openMe(db_obj){
		if(db_obj == undefined){
			cb(null); return;
		}
		
		var db_name = db_obj.db_name;
		var db_host = db_obj.db_host;
		var db_port = db_obj.db_port;
		var alias    = db_obj.alias;

		if(db_name == undefined){
			//console.log(colors.green('[DB]: all databases are opened'));
			cb(null);
		}else{
			try{
			if(db.opened[alias].databaseName == db_name){
				console.log('Connection Already present');
				cb(null);
				return;
			}
		} catch(Exception){
			
			var _dbObj = that.getDbConnection(db_name , db_host , db_port);
		  	_dbObj.open(function (err, opened_db) {
			  	if(err){
			  		cb(true);			  		
			  		console.log(('[DB] Error : opening '+db_name));
			      	return;
			  	}else{	
			  //	opened[alias] = opened_db;	
			  if(typeof that.opened == 'undefined'){
			  	that['opened'] = [];
			  }
			  		that.opened[alias] = opened_db ;
			  		console.log('[DB]: opened '+db_name+' alias='+alias);
			        openMe(databases.shift());
			  	}
			});
		  }
		}
	}	
	openMe(databases.shift()); 
},


openConnectionFromString: function(connection_str, cb){
	var that = this;
	if(typeof(connection_str) == 'undefined'){
		cb('Connection String Not passed');
		return;
	}

	if(typeof(that.opened[connection_str]) == 'undefined'){
	this.getDbConnectionFromString(connection_str, function(err, db){

		if(err){
			cb('Error Opening connection string  - ' + connection_str);
		} else {
		that.opened[connection_str] = db;
		cb('', 'Connection created for string - ' + connection_str);
	}
	});
	} else {
		cb('', 'Yayy!! Connection Already Present');
	}
},
};