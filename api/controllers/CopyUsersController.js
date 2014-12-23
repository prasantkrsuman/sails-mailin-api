/**
 * UsersController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://links.sailsjs.org/docs/controllers
 * @category    :: Sails
 * @version     :: v0.10.5
 * @link        :: https://api.sendinblue.com/users/
 * @since       :: File available since Release v0.10.5
 */

module.exports = {

	/**
     * webservice action is used to get a single user details
     *@param: Email
     *@return: User detail in json format
     */
	index: function (req, res, next) {

		var params = req.params.all();
		var email = req.param('email');

		var criteria = [{"email": email}, {"email":1, "blacklisted":1, "attributes":1, "listid":1, "messages_sent":1,"opened_message":1,"user_history":1,"clicked_message":1,"entered":1}];
		
		var db_name = unique_db_name = req.db_name;
		var db_host = req.db_host

		Users.getOne(db_host, db_name , criteria, function(err, users_data){
			
			if(err) {
				console.log(err); next(err);
			} else {
				
				if(users_data!=null){
					var final_data1 =[]; var final_data2 =[]; var final_data3 =[];
					var final_data4 =[]; var final_data5 =[]; var final_data6 =[];
					 
					for (data in users_data.messages_sent) {
					 	var value = users_data.messages_sent[data];
					 	//console.log("----------------->>>" + JSON.stringify( value['bnc']));
		
					 	if(value !== "undefined"){
			                
			                //total messages sent
			                var date = new Date(value['sent_date']);
			                var res1  = {
			                	event_time : Utility.formatDate(date),
			                	camp_id : value.messageid
			                }; 
			                // console.log(res1);
			                final_data1.push(res1);
			            
							if (value.bnc) {
							 	//event: 'soft_bounces'
				             	if(value['bnc']['0']['r']=='s_b'){   
					                var date = new Date(value['bnc']['0']['d']);
					                var res2  = {
					                	event_time : Utility.formatDate(date),
					                	camp_id : value.messageid
					                }; 
					                //console.log(res2);
					                final_data2.push(res2);  
				            	}			            

				            	//event: 'hard_bounces'
				                if(value['bnc']['0']['r']=='h_b'){
				                	var date = new Date(value['bnc']['0']['d']);
					                var res3  = {
					                	event_time : Utility.formatDate(date),
					                	camp_id : value.messageid
					                }; 
					                //console.log(res3);
					                final_data3.push(res3);
					            }  
				            }
			            }
					}

					//event: 'spam'
					for (data in users_data.user_history) {
					 	var value = users_data.user_history[data];
					 	//console.log("----------------->>>" + JSON.stringify( value['action']));
					 	
					 	if(value !== "undefined" && value['action']=='SPAM'){
				            var date = new Date(value['date']);
			                var res4  = {
			                	event_time : Utility.formatDate(date),
			                	camp_id : value.messageid //no msg id in spam
			                };
							//console.log(res4);
							final_data4.push(res4); 
			        	}
			    	}

			    	//event: 'opened'
			    	for (data in users_data.opened_message) {
					 	var value = users_data.opened_message[data];
					 	//console.log("----------------->>>" + JSON.stringify( value['modified']));
					 	
					 	if(value !== "undefined"){
				            var date = new Date(value['modified']);
			                var res5  = {
			                	event_time : Utility.formatDate(date),
			                	camp_id : value.messageid,
			                	ip : value.ip
			                };
							//console.log(res5);
							final_data5.push(res5); 
			        	}
			    	}	

			    	//event: 'clicked'
			    	for (data in users_data.clicked_message) {
					 	var value = users_data.clicked_message[data];
					 	//console.log("----------------->>>" + JSON.stringify( value));
					 	var msg_data =[];
					 	if(value !== "undefined"){
				            //console.log("----------------->>>" + JSON.stringify( value['links']['0']['ip']));
				            var url = Utility.getDbConnectionString(db_host, unique_db_name);
							db.opened[url].collection('messages').findOne({'id':value.messageid}, {'links_message.url':1}, function(err, msg_data){
								if(err) { console.log('Some Error Encountered' + err); } 
								else { console.log('connected to messages collection in db: --->'+msg_data+"---->" + unique_db_name);

									for (data in msg_data.links_message) {
					 					var value1 = msg_data.links_message[data];
					 					console.log('value: ----->'+value1.url);
					 					msg_data = value1.url
									}
								}
							});

			                var date = new Date(value['links']['0']['modified']);
			                
			                var res6 = {
			                	camp_id : value.messageid,
			                	//links: value.links,
			                	links : [{
			                		links_message_url : msg_data, // value['links']['0']['message_link'],
			                		clicked : value['links']['0']['clicked'],
			                		event_time : Utility.formatDate(date),
			                		ip : value['links']['0']['ip']
			                	}]
					                	
			                };
							//console.log(res6);
							final_data6.push(res6); 
			        	}
			    	}	

					users_data.message_sent = final_data1;					 
					users_data.soft_bounces = final_data2;
					users_data.hard_bounces = final_data3;
					users_data.spam = final_data4;
					users_data.opened = final_data5;
					users_data.clicks = final_data6;
					users_data.messages_sent = undefined; //unset messages_sent
					users_data.user_history = undefined; //unset user_history
					users_data.opened_message = undefined; //unset opened_message
					users_data.clicked_message = undefined; //unset clicked_message
					users_data._id = undefined

					//console.log({msg:'Data retrieved: ', users_data:users_data });
					return res.json({
						code: 'success',
						msg: "Data retrieved for email: "+email,
						data:users_data
				 	});	
				} else{
					return res.json({
						code: 'failure',
						msg: "No user found with given email id: "+email,
						data:[]
				 	});	
				}
			}
		});
    }

};

