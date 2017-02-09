/**
* 水木资本IM即时聊天应用
* @copyright:  www.svmuu.com  
* version : V1.0.0.1
* 
**/


layui.use('layim', function(layim) {
    // return false;  // 用作测试关闭
    // if(globwsconn.readyState !== 1){
    var ws_url = "https:"=== window.location.protocol ? "wss://ws-dev.svmuu.com:7273" : "ws://ws-dev.svmuu.com:7272";
    // var ws_url = "https:"=== window.location.protocol ? "wss://ws.svmuu.com:7273" : "ws://ws.svmuu.com:7282";
    var socket = new WebSocket(ws_url);
    //连接成功时触发
    socket.onopen = function() {
        socket.send('{"type":"login","group_id":"' + storage.group_id + '","box_id":"' + storage.box_id + '","guest_id":"' + storage.uid + '","client_type":"1","token":"' + $.cookie('PHPSESSID') + '","has_video":"1","im_fans_login":"1"}');
    };
    // }else{
    //     var socket = globwsconn;
    //     socket.send('{"type":"login","group_id":"' + storage.group_id + '","box_id":"' + storage.box_id + '","guest_id":"' + storage.uid + '","client_type":"1","token":"' + $.cookie('PHPSESSID') + '","has_video":"1"}');    
    // }

    //基础配置
    layim.config({
        imWindow: "#J-im-window" //IM 的入口  若为false  则右下角弹框显示
        ,offset: [(document.body.clientHeight-480)+'px', '49px'] //聊天主面板显示位置，默认为右下角
        ,userId: storage.uid
        //查看群组接口
        ,init: {
            url: '/im/ajax/get_list?uid=' + storage.uid + '&group_id=' + storage.group_id
            ,data: {}
        }
        ,uploadImage: {
            url: '/js/third-party/weditor/php/upload_json.php' //（返回的数据格式见下文）
            ,type: 'post' //默认post
        }
        ,isfriend: true //是否开启好友
        ,isgroup: false //是否开启群组
        ,issvmessage: true
        ,ishistory: true
        ,isgroupSend: false
        ,isautoReplay: false
        ,chatLog: '/im/ajax/chat_history' //聊天记录地址
        // ,find: './demo/find.html'
        ,copyright: true //是否授权
        ,title: '联系管理' //主面板最小化后显示的名称
        ,tabBar: {
            'style': 'width:33.33%;font-size:12px;',
            'list': [{
                'title': '圈子管理员',
                'icon': '<span class="icon1"></span>圈子',
                'type': 'friend'
            }, {
                'title': '系统消息',
                'icon': '<span class="icon2"></span>系统消息',
                'type': 'svmessage'
            }, {
                'title': '历史会话',
                'icon': '<span class="icon3"></span>历史会话',
                'type': 'history'
            }]
        }
    });

    //监听发送消息
    layim.on('sendMessage', function(data) {
        //发送消息到Socket服务
        imUtil.sendMsg({
            type: 'chatMessage',
            data: {
                "toid": data.to.id,
                "content": data.mine.content
            }
        });
    });

    //监听收到的消息
    socket.onmessage = function(res) {
        var r = eval('(' + res.data + ')');
        var type = r.type;
        var data = r.data;
        switch (type) {
            case 'chatMessage': //聊天消息
                layim.getMessage(data);
                break;
            case 'sysMessage': //系统消息
                scriptFuc._delSvmessage();
                var sysArr = r.list;
                var is_one = sysArr.length>1?false:true;
                for(var i = sysArr.length-1;i>=0;i--) {
                    var _data = {
                        'id': '999999', //小秘书id(固定)
                        'username': '系统消息',
                        'type': 'svmessage', // 消息类型(固定)
                        'msg_id': sysArr[i].msg_id,
                        'content': sysArr[i].content,
                        'title': sysArr[i].title,
                        'is_read': sysArr[i].is_read,
                        'timestamp': sysArr[i].time,
                        'is_one': is_one
                    };
                    layim.getMessage(_data);
                }
                break;
            case 'xmsMessage': //小秘书消息
                scriptFuc._delSvmessage();
                var xmsArr = r.list;
                var is_one = xmsArr.length>1?false:true;
                for(var item = xmsArr.length-1;item>=0;item--) {
                    var _data = {
                        'id': '999998', //小秘书id(固定)
                        'username': '小秘书',
                        // 'group_id': xmsArr[item].group_id || '', // 圈主id(后期扩展)
                        // 'group_username': xmsArr[item].group_username || '', // 圈主名称(后期扩展)
                        // 'avatar': xmsArr[item].avatar || '', // 圈主头像(后期扩展)
                        // 'msg_id': xmsArr[item].mid,
                        'type': 'svmessage', // 消息类型(固定)
                        'content': xmsArr[item].content,
                        'msg_id': xmsArr[item].msg_id,
                        'title': xmsArr[item].title,
                        'timestamp': xmsArr[item].time,
                        'is_read': xmsArr[item].is_read,
                        'is_one': is_one
                    };
                    layim.getMessage(_data);
                }
                break;
            case 'login_success':
                //触发请求系统消息 
                imUtil.sendMsg({
                    type: 'sysMessage'
                });
                // 触发请求小秘书消息
                imUtil.sendMsg({
                    type: 'xmsMessage'
                });

                //获取未读消息
                var local = layui.data('layim')[storage.uid] || {};
                var chatlog = local.chatlog || {};
                var max_msg_id = 0;
                for (var key in chatlog){
                    if($.inArray(key,['svmessage999998','svmessage999999']) < 0){
                        for(var i in chatlog[key]){
                            var msg = chatlog[key][i];
                            if(msg.msg_id && msg && parseInt(max_msg_id) < parseInt(msg.msg_id)){
                                max_msg_id = msg.msg_id;
                            }
                        }
                    }
                }
                var b = {
                    type: 'getNoReadMsg',
                    data: {max_msg_id: max_msg_id}
                };
                imUtil.sendMsg(b);
                break;
            case 'getNoReadMsg':
                for(var i in data){
                    layim.getMessage(data[i]);
                }
                break;
        }
    };

    var imUtil = {
        sendMsg: function(data) {
            var o = JSON.stringify({
                type: 'im_chat_message',
                data: data
            });
            socket.send(o);
        }
    };


    //layim建立就绪
    layim.on('ready', function(res) {
    });

    //监听查看群员
    layim.on('members', function(data) {
    });

    //监听聊天窗口的切换
    layim.on('chatChange', function(data) {
        imUtil.sendMsg({
            type: 'set_obj',
            data: {
                uid: data.data.id
            }
        });
    });

    //小脚本方法
    var scriptFuc = {
        sv_load_flag: 0,
        _delSvmessage: function(){
            var local = layui.data('layim')[storage.uid] || {};
            var chatlog = local.chatlog || {};
            if(this.sv_load_flag === 0){
                delete chatlog.svmessage999999;
                delete chatlog.svmessage999998;
                this.sv_load_flag++;
            }
            local.chatlog = chatlog;
            layui.data('layim', {
                key: storage.uid,
                value: local
            });
        }

    };
});