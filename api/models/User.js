/**
* User.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

	db_name : MyConfig.central_db_name,
	central_db_host : MyConfig.central_db_host,
	central_db_port : MyConfig.central_db_port,

	checkIfUserDBExisting: function(json_filters, next){
		connection_arr = [];
		db_name = this.db_name;
		//console.log('-----------------' + db_name + '-----------------------');
		//console.log(json_filters);
		db.opened[Utility.getRawConnectionString(MyConfig.central_db_host_string)].collection('users').findOne( json_filters, function(err, user){
			if(err) { console.log(err); next(err); } else {
				var db_name = '';
				var user_data = [];
				if(typeof(user) == 'undefined' || user == null) {
					return next({ code: 'failure', message: "Key Not Found In Database", data:[] });
				} else {
					console.log("Connected to client's db: " + user.db_name);
					user_data['db_name'] = user.db_name;
					user_data['db_host'] = user.db_host;
					user_data['db_key'] = user.db_key;
					user_data['email'] = user.contact_details.email;
					user_data['language'] = user.language;
					user_data['server_id'] = user.id;
					if(user.contact_details.login_status!="undefined"){
						user_data['login_status'] = user.contact_details.login_status;
					}
				}
				next(null, user_data);
			}
		});
	},

	update: function(filter, incData, user_up){
		connection_arr = [];
		db_name = this.db_name;
		//console.log('-----------------' + db_name + '-----------------------');
		db.opened[Utility.getRawConnectionString(MyConfig.central_db_host_string)].collection('users').update(filter, incData, function(err, user){
			if(err) {
				console.log('Some Error Encountered' + err);
				return user_up(err,null);
			}
			else {
				console.log("Updated client's api calls in users collection of: "+db_name);
				return user_up(null, user);
			}
		});
	},

    getOne: function(db_host, db_name, data, user_cb){

    	unique_db_name = db_name;
		var url = Utility.getDbConnectionString(db_host, unique_db_name);
		//console.log(url);
		db.openConnectionFromString(url, function(err, conn){
			if(err) { return user_cb(err,null); }
			//console.log('fetch in Db -- ' + unique_db_name);
			db.opened[url].collection('users').findOne(data[0], data[1], function(err, user_data){
				if(err) {
					console.log('Some Error Encountered' + err);
					return user_cb(err,null);
				}
				else {
					console.log('Connected to users collection of db: ' + unique_db_name);
					return user_cb(null, user_data); 
				}
			});
		});
    },

    getUsersCount: function(db_host, db_name, data, user_cb){

    	unique_db_name = db_name;
		var url = Utility.getDbConnectionString(db_host, unique_db_name);
		//console.log(url);
		db.openConnectionFromString(url, function(err, conn){
			if(err) { return user_cb(err,null); }
			//console.log('fetch in Db -- ' + unique_db_name);
			db.opened[url].collection('users').count(data, function(err, user_data){
				if(err) {
					console.log('Some Error Encountered' + err);
					return user_cb(err,null);
				}
				else {
					console.log('Connected to users collection of db: ' + unique_db_name);
					return user_cb(null, user_data); 
				}
			});
		});
    }

  // attributes: {

  // }
};

