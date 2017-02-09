var mysql  = require('mysql');  //调用MySQL模块
module.exports=(function(){
	var pool = mysql.createPool({     
	    host     : 'localhost',       //主机
	    user     : 'root',               //MySQL认证用户名
	    password : 'zw881025zw',        //MySQL认证用户密码
	    port: '3306',//端口号
	    database : 'zw'
		
//      host     : 'localhost',       //主机
//	    user     : 'root',               //MySQL认证用户名
//	    password : '',        //MySQL认证用户密码
//	    port: '3306',//端口号
//	    database : 'zw'
	}); 
	pool.on('connection',function(connection){
		connection.query('SET SESSION auto_increment_increment=1');
	});
	return function(){
		return pool;
	}
})();
