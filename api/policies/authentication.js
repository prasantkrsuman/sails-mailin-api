module.exports = function authentication (req, res, next) {
 	
	var apiKey = req.header('api-key');
	console.log('\n============= S T A R T ===============\n');
	console.log('api-key: '+apiKey);
	//console.log(req.headers);

	var date = new Date();
	console.log('Date: '+date);
	console.log('Input: '+ JSON.stringify(req.params.all()));

	if(typeof apiKey == 'undefined'){
		return res.json(500, apilogs.jsonResponse(req,res,"failure","api-key is missing", []));
	}

	var successResult = {};

		async.series([
		    function(callback) {
	    		/* Code to get client details from CDB -> users collection - Start */
	    		var criteria = {"api_2.api_key": apiKey};
				//console.log(criteria);
				var db_name = User.checkIfUserDBExisting(criteria , function(err, cdbResult){
					if(err) {
						// res.send(500, err);
						//console.log(JSON.stringify(err));
						return res.json(500, apilogs.jsonResponse(req, res, err.code, err.message, err.data));
					} else {
						console.log('db_host: '+cdbResult.db_host);
						console.log('db_name: '+cdbResult.db_name);
						console.log('db_key: '+cdbResult.db_key);
						console.log('server_id: '+cdbResult.server_id);
						console.log('email: '+cdbResult.email);
						console.log('language: '+cdbResult.language);

						apilogs.logme(req, cdbResult.db_name, cdbResult.db_key, res); //input log

						if(cdbResult.login_status==0){
							return res.json(500, apilogs.jsonResponse(req,res,"failure","We cannot accept this request as your account is blocked due to malicious behavior. Please contact support@sendinblue.com if you think its done by mistake.", []));
						}

						/* code to update api call limit - Start */
						if( (cdbResult.limit_bypass!='undefined' && cdbResult.limit_bypass == 1) || (req.options.controller == 'email' && req.options.action == 'post') || (req.options.controller == 'template' && req.options.action == 'put') || (req.options.controller == 'sms' && req.options.action == 'post') ) 
						{
							var incData = {"$inc": {"allapi_calls":1}};
							var filter = {"api_2.api_key": apiKey};
						} else{
							var incData = {"$inc": {"allapi_calls":1, "api_per_hour":1}};               
							var filter = {"api_2.api_key": apiKey};
						}
						
						User.update(filter, incData, function(err, apiCallResult){
							if(err) {
								res.send(500, err);
								console.log(JSON.stringify(err));
							} else {
								console.log(apiCallResult);
							}
						});
						/* code to update api call limit - End */

						// successResult.db_name = cdbResult.db_name;
						// successResult.db_host = cdbResult.db_host;
						// successResult.db_key = cdbResult.db_key;
						// successResult.server_id = cdbResult.server_id;
						// successResult.email = cdbResult.email;
						// successResult.language = cdbResult.language;
						successResult.cdb = cdbResult;

						callback();
					}
				});
				/* Code to get client details from CDB -> users collection - End */
		    },
		    function(callback) {
	    		/* Code to get data form Client DB -> config collection - Start */
				var data = {};
				Config.getOne(successResult.cdb.db_host, successResult.cdb.db_name , data, function(err, configResult){
					//console.log(data);
					if(err){
						console.log('Error in fetching config data.');
						callback(err);
					}
					else{
						//console.log(configResult);
						successResult.config = configResult;
						callback();
					}
				});	
				/* Code to get data form Client DB -> config collection - End */
		    }
		], function(err) {
		    if (err) {
		        throw err; //Or pass it on to an outer callback, log it or whatever suits your needs
		    }

		    /* Code to set fetched data */
		    //console.log(JSON.stringify(successResult));
		    req.data = successResult;
		    //console.log(JSON.stringify(req.data));
			next();

	});

};