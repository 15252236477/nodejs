var connPool = require('../models/ConnPool');
var loginBean = require('../jsbean/loginBean');
var loginBean = new loginBean();
module.exports = {
	zhuce: function(req,res){  //注册
		pool = connPool();
		pool.getConnection(function(err,conn){
			if(err){
				res.send('获取连接失败！错误原因: '+err.message);
				return;
			}
			var userAddSql = 'insert into user(email,pwd,nicheng,createtime) values(?,?,?,current_timestamp)';
			var param = [req.body['email'],req.body['pwd'],req.body['nicheng']];
			conn.query(userAddSql,param,function(err,rs){
				if(err){
					var errorMsg = '';
					if(err.message.indexOf('emailuniq') > -1){
						errorMsg = 'hasEmail'; //sorry:email已经存在！
					}else if(err.message.indexOf('nichenguniq') > -1){
						errorMsg = 'hasNicheng'; //sorry:昵称已经存在！
					}else{
						errorMsg = 'otherError'; //注册失败！(发生错误)
					}
					res.render('account/regist',{tipMsg:errorMsg});
					return;
				}
				//res.send('<script>alert("恭喜你：注册成功!")</script>');
				res.redirect(307,'/account/login/');
				conn.release();
			});
		});
	},
	login:function(req,res){ //登录
		pool = connPool();
		pool.getConnection(function(err,conn){
			if(err){
				res.send('获取连接失败！错误原因: '+err.message);
				return;
			}
			var userAddSql = 'select * from user where email=? and pwd=?';
			var param = [req.body['email'],req.body['pwd']];
			conn.query(userAddSql,param,function(err,rs){
				if(err){
					res.send('<script>alert("数据库连接失败!")</script>');
					return;
				}
				if(rs.length > 0){
					loginBean.id = rs[0].uid;
					loginBean.nicheng = rs[0].nicheng;
					req.session.loginBean = loginBean;
					res.redirect('/account/index/');
				}else{
					console.log('用户名或者密码错误！');
					res.render('account/login', {isLoginSuccess:false});
				}
				conn.release();
			});
		});
	}
}
