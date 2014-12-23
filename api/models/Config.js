/**
* Messages.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {


    getOne: function(db_host, db_name, data, config_cb){

    	unique_db_name = db_name;
		var url = Utility.getDbConnectionString(db_host, unique_db_name);
		//console.log(url);
		db.openConnectionFromString(url, function(err, conn){
			if(err) { return config_cb(err,null); }
			//console.log('fetch in Db -- ' + unique_db_name);
			db.opened[url].collection('config').findOne(data, function(err, config_data){
				if(err) {
					console.log('Some Error Encountered' + err);
					return config_cb(err,null);
				}
				else {
					console.log('Connected to config collection of db: ' + unique_db_name);
					return config_cb(null, config_data); 
				}
			});
		});
    }

};

