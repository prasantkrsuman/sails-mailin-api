/**
* Messages.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {


    getOne: function(db_host, db_name, data, user_cb){

    	unique_db_name = db_name;
		var url = Utility.getDbConnectionString(db_host, unique_db_name);

		db.openConnectionFromString(url, function(err, conn){
			if(err) { return user_cb(err,null); }

			db.opened[url].collection('messages').findOne(data[0], data[1], function(err, msg_data){
				if(err) {
					console.log('Some Error Encountered' + err);
					return user_cb(err,null);
				}
				else {
					console.log('Connected to messages collection of db: ' + unique_db_name);
					return user_cb(null, msg_data); 
				}
			});
		});
    },

    getAll: function(db_host, db_name, data, user_cb){

    	unique_db_name = db_name;
		var url = Utility.getDbConnectionString(db_host, unique_db_name);

		db.openConnectionFromString(url, function(err, conn){
			if(err) { return user_cb(err,null); }
			db.opened[url].collection('messages').find(data[0], data[1], function(err, msg_data){
				if(err) {
					console.log('Some Error Encountered' + err);
					return user_cb(err,null);
				}
				else {
					console.log('Connected to messages collection of db: ' + unique_db_name);
					return user_cb(null, msg_data); 
				}
			});
		});
    }

  // attributes: {

  // }
};

