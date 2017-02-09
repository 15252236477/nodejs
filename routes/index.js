var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
	if(req.session.loginBean == undefined){
		res.render('account/login', {isLoginSuccess:true});
		return;
	}
	loginBean = req.session.loginBean;
    res.render('index', loginBean);
});

module.exports = router;
