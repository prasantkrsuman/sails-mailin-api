module.exports = {

   /**
   * Function to return webaction
   */

	getWsName : function(req,res){
		var action = req.options.action;
		var controller = req.options.controller;
		//console.log('action name: '+action+' & controller name: '+controller);
		var ws_name = '';

		//** var wsname = [{ 'user' : [ {'get' : 'GETUSER'}, {'post' : 'USERCREADIT'} ] }];
		var wsname = { 'user' : {'index' : 'GETUSER', 'post' : 'USERCREADIT'}  };
		var ws = wsname[controller][action];
		if (ws!="undefined") {
			//console.log('webaction: '+ws);
			return ws;
		}   
	},

	/**
	* @action: Function used to add ws logs in logs collection
	* @param: input, client's key, email, language & api version
	* @return: nothing
	*/
	addwslog : function(req,res){

		var version = '2.0';
		var entered_date = new Date();
		var log_action = this.getWsName(req,res);
		var webactionName = ['GETUSER','USERCREADIT'];
		var input1= req.params.all();

		var input2= {
						'webaction' : log_action,
						'key' : req.data.cdb.db_key,
						'email' : req.data.cdb.email,
						'language' : req.data.cdb.language,
						'ip' : req.headers['x-forwarded-for'] || req.connection.remoteAddress           
					};

		var merged_input = JSON.stringify(JSON.parse((JSON.stringify(input1) + JSON.stringify(input2)).replace(/}{/g,",")));
	
		var data = [{
						'webaction' : log_action,
						'input' : merged_input,
						'output' : '', //res -> kept blank
						'entered_date' : entered_date,
						'api_version' : version                   
					}];

		if(webactionName.indexOf(log_action) > -1)
		{
			//insert data in logs collection
			//console.log(data);
			Logs.insert(req.data.cdb.db_host, req.data.cdb.db_name , data, function(err, log_data){
				if (err) {
					console.log(err);
					console.log("Error:Sorry!Something went Wrong");
				}else {
					console.log('log inserted successfully in logs collection');
				}
			});	
		}
	},

	/**
   	* Function to return json response
   	*/
	jsonResponse : function(req, res, code, message, data){
		
		if (typeof(code) === 'undefined' || typeof(message) === 'undefined' || typeof(data) === 'undefined') {
	        code = ""; 
	        message = ""; 
	        data = [];
	    }
	    response = {'code' : code, 'message' : message, 'data' : data };
	    console.log(JSON.stringify(response));

	    var output = {};
	    
	    if(response.message != "Key Not Found In Database"){
	        if(response.code=='failure'){
	          output = {'errorMsg' : response.message};
	          this.addwslog(req,output);
	        }
	        if(response.code=='success'){
				if(response.data!="undefined" && response.data.length !== 0){
					output = {'result' : response.data};
				}
				else{ 
					output = {'result' : response.message};
				}
				this.addwslog(req,output);
	     	}
	    }

	    if(response.message == "Key Not Found In Database"){
			var key = req.header('api-key');
			var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
			//response = {'code' : code, 'message' : message, 'data' : [] };
			var response = {'code' : code, 'message' : message, 'data' : [], 'ip' : ip, 'api_key' : key };
	 	}
	    this.responseLog(req, response);
	    return response;
	},

	/**
   	* Function to log json response in out_logme.txt
   	*/
	responseLog : function(req, res){

		var date = new Date();
		var data = date + "\t" + req.data.cdb.db_name + "\t" + req.data.cdb.db_key + "\t" + JSON.stringify(res) + "\n\n";
		fs = require('fs');
		fs.appendFile('out_logme.txt', data, function (err) {
			if (err) return console.log(err);
			//console.log(data +' > out_logme.txt');
		});

	},

	/**
   	* Function to log request data in logme.txt
   	*/
	logme : function(req, db_name, db_key, res){

		var date = new Date();
		var requestedUrl = req.baseUrl + req.path;
		var input1 = req.params.all();
		var input2 = { 
						'ws_url': requestedUrl, 
						'ws_name': this.getWsName(req,res)
					};

		var merged_input = JSON.stringify(JSON.parse((JSON.stringify(input1) + JSON.stringify(input2)).replace(/}{/g,",")));

		var data = date + "\t" + db_name + "\t" + db_key + "\t" + JSON.stringify(req.headers) +"\t" + merged_input + "\n\n";
		fs = require('fs');
		fs.appendFile('logme.txt', data, function (err) {
			if (err) return console.log(err);
			//console.log(data +' > logme.txt');
		});
  	},

	/**
   	* Function to check the user limit for particular plan type
   	*/
	getUserCountDetail: function(req, res, total_users_list , cb) {
		
		//console.log(JSON.stringify(req.data));
		var total_users_db, user_limit, quota;
		var errorMsg = "";				

		async.series([
			function(callback) {
				if(req.data.config.plan_type !== undefined){
					if(req.data.config.plan_type=='UNLIMITED'){
						if(req.data.config.user_limit!== undefined){		

							user_limit = req.data.config.user_limit;
							console.log('***Config Users count: '+user_limit);

							//connect to users collection & count total users
							var data = {};
							User.getUsersCount(req.data.cdb.db_host, req.data.cdb.db_name , data, function(err, user_data){
								if (err) {
									console.log(err);
									console.log("Error:Sorry!Something went Wrong");
									//callback('Unable to get Users Count.');
								}else {
									total_users_db = user_data; // do count
									console.log('***Users count: '+total_users_db);
									callback();					
								}
							});
						}
						else{
							errorMsg  = "You are trying to upload more users than your quota, list will not be uploaded.";
							callback();
						}
					}
					else{
						errorMsg ='';
						callback();
					}
				}
				else{
					errorMsg  = "You are trying to upload more users than your quota, list will not be uploaded.";
					callback();
				}
			},
			function(callback) {
					
				if (user_limit && total_users_db){
					if(user_limit <= total_users_db ){
						errorMsg  = "You have already reached your maximum number of users quota. Upgrade your plan here. <a href='https://www.sendinblue.com/pricing'>https://www.sendinblue.com</a>";
					}
					else if((total_users_list + total_users_db ) > user_limit ){
						quota = user_limit - total_users_db;
						quota = {'quota':quota};
					}

					cb(null , errorMsg);
				}
				else{

					cb(null);
				}
			}
		], function(err) {

			return cb(err);

		});

	}





}