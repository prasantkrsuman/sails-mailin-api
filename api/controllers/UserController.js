/**
 * UsersController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://links.sailsjs.org/docs/controllers
 * @category    :: Sails
 * @version     :: v0.10.5
 * @link        :: https://api.sendinblue.com/user/
 * @author      :: SLIT
 * @created     :: 28 Nov'14
 * @modified    :: Ekta
 * @modified    :: 28 Nov'14
*/

module.exports = {

	/**
     * webservice action is used to get a single user details
     * @param: Email
     * @return: User detail in json format
     */
	index: function (req, res, next) {

		var user_data = {};
		var msg_ids =[];
		var msg_urls = {};
		var params = req.params.all();
		var email = req.param('id');

		if(!email){
			return res.json(500, apilogs.jsonResponse(req,res,"failure","Email is mandatory.", []));
		}

		var final_data1 =[]; var final_data2 =[]; var final_data3 =[];
		var final_data4 =[]; var final_data5 =[]; var final_data6 =[];

		var criteria = [{"email": email}, {"email":1, "blacklisted":1, "attributes":1, "listid":1, "messages_sent":1,"opened_message":1,"user_history":1,"clicked_message":1,"entered":1}];
		
		var db_name = unique_db_name = req.data.cdb.db_name;
		var db_host = req.data.cdb.db_host

		async.series([
		    function(callback) {
		    	//console.log('callback1');
				User.getOne(db_host, db_name , criteria, function(err, users_data){
					user_data = users_data;
					if(user_data!=null){

						for (data in user_data.messages_sent) {
						 	var value = user_data.messages_sent[data];
			
						 	if(value !== "undefined"){
				                
				                //total messages sent
				                var date = new Date(value['sent_date']);
				                var res1  = {
				                	event_time : Utility.formatDate(date),
				                	camp_id : value.messageid
				                }; 
				                final_data1.push(res1);
				            
								if (value.bnc) {
								 	//event: 'soft_bounces'
					             	if(value['bnc']['0']['r']=='s_b'){   
						                var date = new Date(value['bnc']['0']['d']);
						                var res2  = {
						                	event_time : Utility.formatDate(date),
						                	camp_id : value.messageid
						                }; 
						                final_data2.push(res2);  
					            	}			            

					            	//event: 'hard_bounces'
					                if(value['bnc']['0']['r']=='h_b'){
					                	var date = new Date(value['bnc']['0']['d']);
						                var res3  = {
						                	event_time : Utility.formatDate(date),
						                	camp_id : value.messageid
						                }; 
						                final_data3.push(res3);
						            }  
					            }
				            }
						}

						//event: 'spam'
						for (data in user_data.user_history) {
						 	var value = user_data.user_history[data];					 	
						 	if(value !== "undefined" && value['action']=='SPAM'){
					            var date = new Date(value['date']);
				                var res4  = {
				                	event_time : Utility.formatDate(date),
				                	camp_id : value.messageid //no msg id in spam
				                };
								final_data4.push(res4); 
				        	}
				    	}

				    	//event: 'opened'
				    	for (data in user_data.opened_message) {
						 	var value = user_data.opened_message[data];					 	
						 	if(value !== "undefined"){
					            var date = new Date(value['modified']);
				                var res5  = {
				                	event_time : Utility.formatDate(date),
				                	camp_id : value.messageid,
				                	ip : value.ip
				                };
								final_data5.push(res5); 
				        	}
				    	}	

				    	//event: 'clicked'
				    	for (data in user_data.clicked_message) {
						 	var value = user_data.clicked_message[data];
							if(value !== "undefined"){
							 	msg_ids.push(value.messageid);
							}
						}

						//console.log(msg_ids);
						callback();			
					}
					else{
						return res.json(500, apilogs.jsonResponse(req,res,"failure","No user found with given email id: "+email, []));
					}
				});	
		    },
		    function(callback) {
		    	//console.log('callback2');
		    	//console.log(msg_ids);
				var msgCriteria = [{'id': { '$in': msg_ids }}, {'links_message.url':1, 'id':1}];

		    	Messages.getAll(db_host, db_name , msgCriteria, function(err, msg_data){
					msg_data.each(function(err, data){
						//console.log(data);
						if (data) {
							//console.log(data.links_message);
							msg_urls[data.id] = data.links_message[0]['url'];
						}
						else{
							//console.log(msg_urls);
							callback();
						}
					});
				});				
		    }
		], function(err) {
		    if (err) {
		        throw err; //Or pass it on to an outer callback, log it or whatever suits your needs
		    }
			
			//console.log(JSON.stringify(msg_urls));
	    	//event: 'clicked'
			for (data in user_data.clicked_message) {
			 	var value = user_data.clicked_message[data];
			    var date = new Date(value['links']['0']['modified']);

			    var res6 = {
			    	camp_id : value.messageid,
			    	links : [{
			    		links_message_url : msg_urls[value.messageid],
			    		clicked : value['links']['0']['clicked'],
			    		event_time : Utility.formatDate(date),
			    		ip : value['links']['0']['ip']
			    	}]
			            	
			    };
				final_data6.push(res6); 
			}

			// Set final result
    		user_data.message_sent = final_data1;					 
			user_data.soft_bounces = final_data2;
			user_data.hard_bounces = final_data3;
			user_data.spam = final_data4;
			user_data.opened = final_data5;
			user_data.clicks = final_data6;
			user_data.messages_sent = undefined; //unset messages_sent
			user_data.user_history = undefined; //unset user_history
			user_data.opened_message = undefined; //unset opened_message
			user_data.clicked_message = undefined; //unset clicked_message
			user_data._id = undefined

			return res.json(200, apilogs.jsonResponse(req,res,"success","Data retrieved for email: "+email, user_data));

		});

    },


    /**
     * webservice action is used to craete/update a single user
     * @param: User details
     * @return: UserId in json format
     */
    post: function (req, res, next) {

    	var params = req.params.all();
    	//console.log(JSON.stringify(params));
    	var email = req.param('email');
    	var attributes = JSON.parse(req.param('attributes'));
    	var listid = JSON.parse("{\"listid\":" + req.param('listid') + "}"); //convert string to array
    	var listid_unlink = JSON.parse("{\"listid_unlink\":" + req.param('listid_unlink') + "}"); //convert string to array
    	var blacklisted = parseInt(req.param('blacklisted'));
    	var blacklisted_sms = parseInt(req.param('blacklisted_sms'));

    	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
		var date = new Date();

    	var errorMsg, smsMsg, FinalMsg, SMSAttr;
    	var user_data, smsUser, listArr = {};
    	//var listArr = [];

    	console.log('^^^^'+JSON.stringify(listid.listid));
    	console.log('^^^^'+ typeof listid);

    	//console.log('postAction------>'+ typeof Object.keys(attributes));
    	if(!email && !attributes.SMS){
    		return res.json(500, apilogs.jsonResponse(req,res,"failure","Please provide Email or SMS attribute value to create/update user.", []));
    	}
    	// valid mobile number check
    	if(attributes.SMS !== undefined && !attributes.SMS.match(/^(?:\+|00|0|)[1-9][0-9]{5,15}$/)){
    		return res.json(500, apilogs.jsonResponse(req,res,"failure","Invalid phone number", []));
    	}
    	// valid email check
    	if(email !== undefined && !email.match(/([+a-zA-Z0-9._-]+@[a-zA-Z0-9._-]{2,}\.[a-zA-Z]{2,6})/i)){
    		return res.json(500, apilogs.jsonResponse(req,res,"failure","Invalid Email Address", []));
    	}

    	//code not working
		// console.log('postAction ' + Array.isArray(listid) +'------'+ typeof listid);   	
		//if(listid!=='undefined' & listid_unlink!=='undefined' & Array.intersect(listid, listid_unlink)){
		// 	return res.json(500, apilogs.jsonResponse(req,res,"failure","List id & unlink list id can not be same", []));
		// }

		if(email){
			var criteria = [{"email": email}, {}];
		} else if (!email && attributes.SMS){
			email = attributes.SMS+'@mailin-sms.com'
			var criteria = [{"email": email}, {}];
		}
		
		var db_name = unique_db_name = req.data.cdb.db_name;
		var db_host = req.data.cdb.db_host

    	UserCreateUpdate = apilogs.getUserCountDetail(req, res, 1 , function(err , data){

    		//console.log(data);
    		if(err){
    			console.log('Some Error Encountered' + err);
				return err;
    		}
    		if(data){
    			console.log('user limit exceded ---------');
	        	return res.json(500, apilogs.jsonResponse(req, res, "failure", data, []));
    		}
	        else{
	        	//find user, if found update record, else create it
	        	User.getOne(db_host, db_name , criteria, function(err, users_data){
	        		user_data = users_data;
	        		if(user_data!=null){ //update user

	        			console.log('--- update user ---'+JSON.stringify(user_data.attributes));

	     //    			//match input listd ids in list collection, & add all those found
	     //    			var listCriteria = [{'id': { '$in': listid.listid }, 'list_parent': {'$ne': 0}}, {'id':1}];

				  //   	Lists.getAll(db_host, db_name , listCriteria, function(err, list_data){
						// 	//console.log(list_data);
						// 	list_data.each(function(err, data){
						// 		//console.log(JSON.stringify(listCriteria));
						// 		//console.log(data);
						// 		if (data) {
						// 			//console.log(data.id);
						// 			listArr = data['id'];
						// 			console.log(listArr+'@@@@@');
						// 		}
						// 	});
						// });	

	     //    			//if SMS, check if already exist, if yes, create new user leaving SMS with a msg, if not add the value in sms attrinute
						// //attributes.SMS
						// var smsCriteria = [{"attributes.SMS": attributes.SMS}, {}];
						// User.getOne(db_host, db_name , smsCriteria, function(err, smsuser_data){
						// 	smsUser = smsuser_data;
						// 	if(smsUser!=null){ //SMS already exists
						// 		console.log('--- SMS already exists ---'+smsUser.attributes.SMS);
						// 		var smsMsg = '';
								
						// 		if(smsUser.attributes.SMS == user_data.attributes.SMS)
						// 		{ 
						// 			attributes['SMS'] = user_data.attributes.SMS;						
						// 			FinalMsg = "Email was updated successfully.";
						// 		}

						// 		else if (smsUser.email!=email){
						// 			var smsMsg = 'but the phone number has been ignored because it already exists';
						// 			attributes['SMS'] = user_data.attributes.SMS; //smsUser.attributes.SMS; //set existing sms in post
						// 			FinalMsg = "Email was updated successfully "+smsMsg;
						// 		}
						// 	}else {
						// 		attributes['SMS'] =  attributes.SMS; //set existing sms in post
						// 		FinalMsg = "Email was updated successfully ";
						// 	}
						// });

						//TO DO

						//  var data = [{

						// 	'listid' : { 'id': listArr },
						// 	'attributes' : attributes,
						// 	'blacklisted' : blacklisted,
						// 	'sms_bl' : blacklisted_sms, 
						// 	'v' : '', //to do
						// 	'user_history' : [],
						// 	'id': 48003358, //$usersModel->getMaxID(true); to do
						// 	'email' : email,
						// 	'sc' : 0, //to filter new hotmail user 
						// 	'email_tag' : '', //$this->email_tag($user_email);
						// 	'shr_key' : '', //$this->shr_key($user_email);
						// 	'entered' : Utility.formatDate(new Date())

						// }];
						// console.log(data);
						// update parames --> users collection
						// User.insert(req.data.cdb.db_host, req.data.cdb.db_name , data, function(err, log_data){
						// 	if (err) {
						// 		console.log(err);
						// 		console.log("Error:Sorry!Something went Wrong in insertion");
						// 	}else {
						// 		return res.json(200, apilogs.jsonResponse(req,res,"success", FinalMsg, []));
						// 	}
						// });	

	        		}
	        		else{ //CREATE user

	        			//match input listd ids in list collection, & add all those found
	        			var listCriteria = [{'id': { '$in': listid.listid }, 'list_parent': {'$ne': 0}}, {'id':1}];

				    	Lists.getAll(db_host, db_name , listCriteria, function(err, list_data){
							//console.log(list_data);
							list_data.each(function(err, data){
								if (data) {
									listArr = data['id'];
									console.log(listArr+'-------');
								}
							});
						});	

				    	//if SMS, check if already exist, if yes, create new user leaving SMS with a msg, if not add the value in sms attrinute
						var smsCriteria = [{"attributes.SMS": attributes.SMS}, {}];
						User.getOne(db_host, db_name , smsCriteria, function(err, smsuser_data){
							smsUser = smsuser_data;
							if(smsUser!=null){ //SMS already exists
								console.log('--- SMS already exists ---'+smsUser.attributes.SMS);
								var smsMsg = 'but the phone number has been ignored because it already exists';
								attributes.SMS = ''; //smsUser.attributes.SMS; //set existing sms in post as blank
								FinalMsg = "User created successfully "+smsMsg;
							}else{
								var smsMsg = '';
								attributes.SMS =  attributes.SMS; //set existing sms in post
								FinalMsg = "User created successfully ";
							}


						});	

						//Get max id & create user
						User.getMaxID(req.data.cdb.db_host, req.data.cdb.db_name, true, function(err, maxId){
							
							var data = {

								'listid' : { 'id' : listArr },  //need to be fixed
								'attributes' : attributes,
								'id': maxId,
								'email' : email,
								'sc' : 0, //to filter new hotmail user 
								'email_tag' : apilogs.email_tag(email),
								'shr_key' : User.shr_key(email),
								'entered' : Utility.formatDate(date),
								'blacklisted' : blacklisted,
							};

						 	if(blacklisted == 0){
		                        data.user_history = [{'action' : 'AUNSUBS_NO', 'date' : Utility.formatDate(date), 'ip' : ip}]
		                    }else{
		                        data.user_history = [{'action' : 'AUNSUBS', 'date' : Utility.formatDate(date), 'ip' : ip}]
		                    }
							if(attributes.SMS){
								if(blacklisted_sms && blacklisted_sms != 0) { 
									data.sms_bl = 1,
									data.user_history = [{'action' : 'ASTOP', 'date' : Utility.formatDate(date), 'ip': ip}]
								}

								//data.v = apilogs.varifyCountry(attributes.SMS)
								apilogs.varifyCountry(attributes.SMS, function(err, value){
									if (err) {
										console.log(err)
									}
									else {
										console.log('getting late value --- '+value);
										data.v = value //need to be fixed
									}
								});
							}

							console.log(data);
							//TO DO: add transactional attr creation code
							//insert : users collection
							User.insert(req.data.cdb.db_host, req.data.cdb.db_name , data, function(err, log_data){
								if (err) {
									console.log("Error: Sorry!Something went Wrong while insertion "+ err);
								}else {
									return res.json(200, apilogs.jsonResponse(req,res,"success", FinalMsg, []));
								}
							});	

						});
							
	        		}

	        	});
	        }

    	});

    }

};