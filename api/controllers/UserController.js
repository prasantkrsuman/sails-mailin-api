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
     * webservice action is used to create/update a single user
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
    	var user_data, smsUser = {};
    	var listArr= [];

    	//console.log(JSON.stringify(listid.listid));
    	//console.log( typeof listid);

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

	        async.series([
		    function(callback) {
	        		/******* BLOCK 1********/
        			//match input listd ids in list collection, & add all those found
        			var listCriteria = [{'id': { '$in': listid.listid }, 'list_parent': {'$ne': 0}}, {'id':1}];

			    	Lists.getAll(db_host, db_name , listCriteria, function(err, list_data){
						//console.log(list_data);
						list_data.each(function(err, data){
							if (data) {
								listArr = listArr.concat(data.id);
								//console.log(listArr);
							}
						});
					});	

			    	//if SMS, check if already exist, if yes, create new user leaving SMS with a msg, if not add the value in sms attrinute
					var smsCriteria = [{"attributes.SMS": attributes.SMS}, {}];
					
					User.getOne(db_host, db_name , smsCriteria, function(err, smsuser_data){
						smsUser = smsuser_data;
						var smsMsg = '';
						if(smsUser!=null){ //SMS already exists
							if(smsUser.attributes.SMS==attributes.SMS && smsUser.email==email){
								smsMsg = '';
								attributes.SMS =  smsUser.attributes.SMS; //existing sms value in db
							}
							else{
								console.log('--- SMS already exists ---'+smsUser.attributes.SMS);
								smsMsg = 'but the phone number has been ignored because it already exists';
								attributes.SMS = ''; //unset sms existing in post
							}
						}else{ //SMS is new
							smsMsg = '';
							attributes.SMS =  attributes.SMS; //set sms existing in post

						}

						console.log('async block 1: '+listArr + smsMsg+' ********');
						callback();
					});

					/***************/
			} ], function(err) {
		    if (err) {
		        throw err; //Or pass it on to an outer callback, log it or whatever suits your needs
		    }
					console.log('async block 2: '+listArr + smsMsg+' ********');
					/******* BLOCK 2********/
	        		if(user_data!=null){ 
	        			
	        			// UPDATE user
	        			FinalMsg = "Email was updated successfully "+smsMsg;
	        			console.log('--- update user ---');
	        			//console.log(JSON.stringify(user_data.attributes));
	        			return res.json(200, apilogs.jsonResponse(req,res,"success", FinalMsg, []));
	        		}
	        		else{ 

	        			// CREATE user
	        			FinalMsg = "User created successfully "+smsMsg;
						//Get max id & create user
						User.getMaxID(req.data.cdb.db_host, req.data.cdb.db_name, true, function(err, maxId){
							
							var data = {

								'listid' : { 'id' : listArr },
								'id': maxId,
								'email' : email,
								'sc' : 0, //to filter new hotmail user 
								'email_tag' : apilogs.email_tag(email),
								'shr_key' : User.shr_key(email),
								'entered' : Utility.formatDate(date),
								'blacklisted' : blacklisted,
							};

							if(attributes){
								data.attributes = attributes
							}else{
								data.attributes = {}
							}

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

								//data.v = apilogs.verifyCountry(attributes.SMS)
								apilogs.verifyCountry(attributes.SMS, function(err, value){
									if (err) {
										console.log(err)
									}
									else {
										console.log('getting late value --- '+value);
										data.v = value //need to be fixed
									}
								});
							}

							//TO DO: add transactional attr creation code (check normal attr func. too like in zend)
							// if(userTransAttrib) {
							// 	data.TRANSACTIONAL = [ userTransAttrib ]
							// }

							console.log(data);
							
							/******* BLOCK 3********/
							//insert : users collection
							User.insert(req.data.cdb.db_host, req.data.cdb.db_name , data, function(err, log_data){
								if (err) {
									console.log("Error: Sorry!Something went wrong while insertion "+ err);
								}else {
									return res.json(200, apilogs.jsonResponse(req,res,"success", FinalMsg, { 'id': maxId }));
								}
							});	
							/***************/

						});
							
	        		}
					/***************/

				});	


	        	});
	        }

    	});

    }

};