module.exports = function authentication (req, res, next) {
 	
	var apiKey = req.header('api-key');
	console.log('\n============= S T A R T ===============\n');
	console.log('api-key: '+apiKey);
	//console.log(req.headers);

	var date = new Date();
	console.log('Date: '+date);
	console.log('Input: '+ JSON.stringify(req.params.all()));

	if(typeof apiKey == 'undefined'){
		// var result = {
		// 		code: 'failure',
		// 		message: "api-key is missing",
		// 		data:[]
		//  	};
		// console.log(result);
		// return res.json(500, result);
		return res.json(500, apilogs.jsonResponse(req,res,"failure","api-key is missing", []));
	}
	var criteria = {"api_2.api_key": apiKey};
	//console.log(criteria);
	var db_name = User.checkIfUserDBExisting(criteria , function(err, success){
		if(err) {
			// res.send(500, err);
			//console.log(JSON.stringify(err));
			return res.json(500, apilogs.jsonResponse(req, res, err.code, err.message, err.data));
		} else {
			console.log('db_host: '+success.db_host);
			console.log('db_name: '+success.db_name);
			console.log('db_key: '+success.db_key);
			console.log('server_id: '+success.server_id);
			console.log('email: '+success.email);
			console.log('language: '+success.language);

			apilogs.logme(req, success.db_name, success.db_key, res); //input log

			if(success.login_status==0){
				// var result = {
				// 	code: 'failure',
				// 	message: "We cannot accept this request as your account is blocked due to malicious behavior. Please contact support@sendinblue.com if you think its done by mistake.",
				// 	data:[]
		 	// 	};
				// console.log(result);
				// return res.json(500, result);
				return res.json(500, apilogs.jsonResponse(req,res,"failure","We cannot accept this request as your account is blocked due to malicious behavior. Please contact support@sendinblue.com if you think its done by mistake.", []));
			}

			/* code to update api call limit- Start */
			if( (success.limit_bypass!='undefined' && success.limit_bypass == 1) || (req.options.controller == 'email' && req.options.action == 'post') || (req.options.controller == 'template' && req.options.action == 'put') || (req.options.controller == 'sms' && req.options.action == 'post') ) 
			{
				var incData = {"$inc": {"allapi_calls":1}};
				var filter = {"api_2.api_key": apiKey};
			} else{
				var incData = {"$inc": {"allapi_calls":1, "api_per_hour":1}};               
				var filter = {"api_2.api_key": apiKey};
			}
			
			User.update(filter, incData, function(err, success){
				if(err) {
					res.send(500, err);
					console.log(JSON.stringify(err));
				} else {
					console.log(success);
				}
			});
			/* code to update api call limit- End */

			req.db_name = success.db_name;
			req.db_host = success.db_host;
			req.db_key = success.db_key;
			req.server_id = success.server_id;
			req.email = success.email;
			req.language = success.language;

			//get config data - start
			var data = {};
			Config.getAll(req.db_host, req.db_name , data, function(err, success){
				if (err) {
					console.log(err);
					console.log("Error:Sorry!Something went Wrong");
				}else {
					console.log(success+'######');
					console.log('plan_type: '+success.plan_type);
					req.plan_type = success.plan_type;
				}
			});	
			//get config data - end

			next();
		}
	});

};