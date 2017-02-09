var express = require('express');
var router = express.Router();
var account = require('../controllers/account.js');

/* 登录 */
router.all('/login/', function(req, res, next) {
  var subflag = req.body['subflag'];
	if(subflag == undefined){
			console.log('还没有登录'); 	
			res.render('account/login', {isLoginSuccess:true});
	}else{
		account.login(req,res);
	}
});

/* 注册 */
router.get('/regist/', function(req, res, next) {
	//loginBean = req.session.loginBean;
	res.render('account/regist', {tipMsg:''});
});

/* GET 注册提交 */
router.post('/regsubmit/', function(req, res, next) {
	account.zhuce(req,res);
});

//退出
router.get('/layout/', function(req, res, next) {
	req.session.destroy(function(err){
		 if(err){
		 	 console.log('出现错误！！！');
		 	 return;
		 }
		 console.log('退出！'+req.session);
		 res.redirect('/');
	});
});

/* 首页 */
router.get('/index/', function(req, res, next) {
	loginBean = req.session.loginBean;
	res.render('index', loginBean);
});

module.exports = router;
