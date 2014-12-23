/**
* Messages.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {


    insert: function(db_host, db_name, data, log_cb){

    	unique_db_name = db_name;
		var url = Utility.getDbConnectionString(db_host, unique_db_name);

		db.openConnectionFromString(url, function(err, conn){
			if(err) { return log_cb(err,null); }

			db.opened[url].collection('logs').insert(data, function(err, log_data){
				if(err) {
					console.log('Some Error Encountered' + err);
					return log_cb(err,null);
				}
				else {
					console.log('Connected to logs collection of db: ' + unique_db_name);
					return log_cb(null, log_data); 
				}
			});
		});
    }

};

