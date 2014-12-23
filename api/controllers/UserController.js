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
    	var listid = req.param('listid'); //convert string to array
    	var listid = listid.split(",");
    	var listid_unlink = req.param('listid_unlink');
    	var listid_unlink = listid_unlink.split(",");
    	var blacklisted = req.param('blacklisted');
    	var blacklisted_sms = req.param('blacklisted_sms');
    	var errorMsg;

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
	
    	errorMsg = apilogs.getUserCountDetail(req, res, 1);
    	console.log(errorMsg+'##########');
        if(errorMsg != false){
        	console.log('user limit exceded ---------');
        	return res.json(500, apilogs.jsonResponse(req, res, "failure", errorMsg, []));
        }
        else{
        	console.log('create/update user --------');
        }





    	console.log('postAction');
		return res.json(200, apilogs.jsonResponse(req,res,"success","post action", []));

    }

};