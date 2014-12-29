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

	//CDB -> users COLLECTION
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

	//CDB -> USERS COLLECTION
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
    },

    insert: function(db_host, db_name, data, user_cb){

    	unique_db_name = db_name;
		var url = Utility.getDbConnectionString(db_host, unique_db_name);

		db.openConnectionFromString(url, function(err, conn){
			if(err) { return user_cb(err,null); }

			db.opened[url].collection('users').insert(data, function(err, user_data){
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

    getMaxID: function(db_host, db_name, insertId, user_cb){

    	unique_db_name = db_name;
    	maxID = Counters.getNextSequence(db_host, db_name,'users', null, function(err, counter_data){
    		   	//console.log('#1#'+counter_data);
				if(counter_data<=1){

				 	coll_max_id = User.getMaxID_users(db_host, db_name, insertId, function(err, seq_cb){ 

			            if(!seq_cb){ // if user doesn't exists, return maxId as 1
			                return user_cb(null, 1); 
			            }else{ //update counters with users max id
			                Counters.getNextSequence(db_host, db_name,'users', seq_cb, function(err, counter_data){
			                	return user_cb(null, counter_data); 

			                });
			            }

				 	});

				}
				//console.log('#2#'+counter_data);
				return user_cb(null, counter_data); 
    	});


    },

    getMaxID_users: function(db_host, db_name, insertId, user_cb) {
        
        maxid = '';
    	unique_db_name = db_name;
		var url = Utility.getDbConnectionString(db_host, unique_db_name);

		db.openConnectionFromString(url, function(err, conn){
			if(err) { return user_cb(err,null); }
			//console.log('fetch in Db -- ' + unique_db_name);
			var options = {
				'timeout':-1,
				'sort' : {'id':-1},
				//'limit' : 1
			};
			db.opened[url].collection('users').findOne({}, {'id':1}, options, function(err, user_data){
			//db.opened[url].collection('users').find({}, {'id':1}, options, function(err, user_data){
				if(err) {
					console.log('Some Error Encountered' + err);
					return user_cb(err,null);
				}
				else {
					console.log('Connected to users collection of db: ' + unique_db_name);
					//console.log('Seq-------------------' + JSON.stringify(user_data));

					if (user_data) {
						//console.log(data.id);
						maxid = user_data['id'];
						if(insertId){ maxid = maxid+1; }
							console.log(maxid+'@@@@@');
							return user_cb(null, maxid); 
					}
				}
			});

		});
	},

	/**
	* Used to get Shard Key which is order(integer) of first letter of email for a@b.com key is 1 , z@b.com key is 26
	* @param string email
	*/
	shr_key: function(email, cb){
		var start_with = email.trim().substr(0, 1);
		var abc= ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
		var key = abc.indexOf(start_with);
		key = (key == -1) ? 0 : key ;
		if(cb){
			cb(null, parseInt(key)+1);
		}
		else {
			return parseInt(key)+1;
		}
	} //end of shr_key();



  // attributes: {

  // }
};

