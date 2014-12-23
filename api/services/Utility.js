module.exports = {
	timestamp : function(){
		var timestamp = new Date().valueOf();
		return timestamp;
	},
	getUniqueString: function(){
		var str = (Math.floor(Math.random() * (1000000000 - 1 + 1)) + 1 + this.timestamp()).toString(36).substr(1,7);
		return str;
	},

	getRawConnectionString: function(connection_string){
		return format("mongodb://%s", connection_string)
	},

	getDbConnectionString: function(connection_string, db_name){
		return this.getRawConnectionString(connection_string) + '/' + db_name;
	},

	formatDate: function(date,type){
		var date_str = '';
		if(date!="undefined"){
			date_str = date.getFullYear() +'-'+ (parseInt(date.getMonth()+1) < 10 ? "0" : "") + parseInt(date.getMonth()+1) +'-'+ (date.getDate()< 10 ? "0" : "") + date.getDate();
		}
		return date_str;
	}

}