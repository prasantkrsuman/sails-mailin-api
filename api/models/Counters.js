/**
* User.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

	
    getNextSequence: function(db_host, db_name, data, count, counter_cb){

    	//console.log('-----'+data);
    	unique_db_name = db_name;
		var url = Utility.getDbConnectionString(db_host, unique_db_name);

		db.openConnectionFromString(url, function(err, conn){
			if(err) {
				//console.log(err);
				return counter_cb(err,null);
			}

			else{


				if(count){
					var update = { $set: {'seq':count } };
				}else{
					var update = { $inc: {'seq':1 } };
				}

				db.opened[url].collection('counters').findAndModify({ _id: data },{},update,{new : true,upsert: true}, function(err, counter_data){
					if(err) {
						console.log('Some Error Encountered' + err);
						return counter_cb(err,null);
					}
					else {
						console.log('Connected to counters collection of db: ' + unique_db_name);
						//console.log(JSON.stringify(counter_data.seq));
						return counter_cb(null, counter_data.seq); 
					}
				});
			}

		});
    }

  // attributes: {

  // }
};

