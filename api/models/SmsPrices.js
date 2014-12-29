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

	//CDB -> sms_prices COLLECTION
	getCountryCode: function(data, smsPrices_cb){
		connection_arr = [];
		db_name = this.db_name;
		//console.log('-----------------' + db_name + '-----------------------');
		//console.log(data);
		db.opened[Utility.getRawConnectionString(MyConfig.central_db_host_string)].collection('sms_prices').find( data[0], data[1], function(err, smsPrices){
			if(err) {
				console.log('Some Error Encountered' + err);
				return smsPrices_cb(err,null);
			} else {
				console.log("Connected to sms_prices collection of CDB");
				return smsPrices_cb(null, smsPrices);
			}
		});
	}

};

