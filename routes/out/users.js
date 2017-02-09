var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/* GET userlist listing. */
router.all('/userlist/', function(req, res, next) {
	var data = {
		name: 'zhuangwei',
		age: '25',
		title: 'express',
		show: '<div>这里是带标签的内容</div>'
	}
  res.render('userlist', data);
  //res.sendFile('/前端总结/dom.txt');
});

module.exports = router;
