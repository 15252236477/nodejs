/**

 @Name：layim v2.0.83 
 @Author：svmuu
 @Site：http://www.svmuu.com
 @License：LGPL
    
 */

layui.define(['jquery', 'layer', 'laytpl', 'upload'], function(exports) {

    var v = '2.0.83';
    var $ = layui.jquery;
    var layer = layui.layer;
    var laytpl = layui.laytpl;
    var sv_load_flag = 0;
    var headimg = {
             "999999": layui.cache.dir + 'images/sysmsg.png'  //系统消息默认头像
            ,"999998": layui.cache.dir + 'images/xmsmsg.png'  // 小秘书默认头像
        };

    var SHOW = 'layim-show',
        THIS = 'layim-this';

    //回调
    var call = {};

    //对外API
    var LAYIM = function() {
        this.v = v;
        $('body').on('click', '*[layim-event]', function(e) {
            var othis = $(this),
                methid = othis.attr('layim-event');
            events[methid] ? events[methid].call(this, othis, e) : '';

            $("#layui-layim-chat").find("span.icon6").hide();
            $("#layui-layim-chat").find(".layim-chat-list li").mouseover(function(e){
                $(this).find("span.icon6").show();
                stope(e);
            }).mouseleave(function(e){
                $(this).find("span.icon6").hide();
                stope(e);
            })

        });
    };

    //基础配置
    LAYIM.prototype.config = function(options) {
        var skin = [
            layui.cache.dir + 'css/pc/layim/skin/01.jpg', layui.cache.dir + 'css/pc/layim/skin/02.jpg', layui.cache.dir + 'css/pc/layim/skin/03.jpg', layui.cache.dir + 'css/pc/layim/skin/04.jpg'
        ];
        
        options = options || {};
        options.skin = options.skin || [];
        layui.each(options.skin, function(index, item) {
            skin.unshift(item);
        });
        options.skin = skin;

        options = $.extend({
            isfriend: false,
            isgroup: false,
            issvmessage: false,
            isgroupSend: false,
            isautoReplay: false,
            ishistory: false
        }, options);


        // 添加面板tab切换标题，若自定义标题数组，则按自定义处理，或者默认处理  wjq  2016-8-3
        options.tabBar = options.tabBar || [];

        if (!window.JSON || !window.JSON.parse) return;
        init(options);
        return this;
    };

    //监听事件
    LAYIM.prototype.on = function(events, callback) {
        if (typeof callback === 'function') {
            call[events] ? call[events].push(callback) : call[events] = [callback];
        }
        return this;
    };

    //获取所有缓存数据
    LAYIM.prototype.cache = function() {
        return cache;
    };

    //打开一个自定义的聊天界面
    LAYIM.prototype.chat = function(data) {
        if (!window.JSON || !window.JSON.parse) return;
        return popchat(data), this;
    };

    //设置聊天界面最小化
    LAYIM.prototype.setChatMin = function() {
        return setChatMin(), this;
    };

    //接受消息
    LAYIM.prototype.getMessage = function(data) {
        return getMessage(data), this;
    };

    //添加好友/群
    LAYIM.prototype.addList = function(data) {
        return addList(data), this;
    };

    //删除好友/群
    LAYIM.prototype.removeList = function(data) {
        return removeList(data), this;
    };

    //解析聊天内容
    LAYIM.prototype.content = function(content) {
        return layui.laytpl.content(content);
    };

    //主模板
    var listTpl = function(options) {
        var nodata = {
            friend: "该分组下暂无圈主管理员",
            group: "暂无群组",
            svmessage: "暂无消息",
            groupSend: "暂无管理项",
            history: "暂无历史会话"
        };

        options = options || {};
        options.item = options.item || ('d.' + options.type);

        return ['{{# var length = 0; layui.each(' + options.item + ', function(i, data){ length++; }}'
            , '<li layim-event="chat" data-type="' + options.type + '" data-index="{{ ' + (options.index || 'i') + ' }}" id="layim-' + options.type + '{{ data.id }}">'
            ,'<img src="{{ data.avatar }}">'
            ,'<span>{{ data.username||data.actname||data.groupname||data.name||"佚名" }}</span></li>'
            , '{{# }); if(length === 0){ }}'
            , '<li class="layim-null">' + (nodata[options.type] || "暂无数据") + '</li>'
            , '{{# } }}'].join('');
    };

    // diy-test  wjq  2016-8-8
    var elemTpl = ['<div class="layui-layim-main">'
        , '<div class="layui-layim-info" style="height:20px;" >'
        , '<div class="layui-layim-user">{{ d.mine.username }}</div>'
        // , '<div class="layui-layim-status">'
        //     , '{{# if(d.mine.status === "online"){ }}'
        //         , '<span class="layui-icon layim-status-online" layim-event="status" lay-type="show">&#xe617;</span>'
        //     , '{{# } else if(d.mine.status === "hide") { }}'
        //         , '<span class="layui-icon layim-status-hide" layim-event="status" lay-type="show">&#xe60f;</span>'
        //     , '{{# } }}'
        //     , '<ul class="layui-anim layim-menu-box">'
        //         , '<li {{d.mine.status === "online" ? "class=layim-this" : ""}} layim-event="status" lay-type="online"><i class="layui-icon">&#xe618;</i><cite class="layui-icon layim-status-online">&#xe617;</cite>在线</li>'
        //         , '<li {{d.mine.status === "hide" ? "class=layim-this" : ""}} layim-event="status" lay-type="hide"><i class="layui-icon">&#xe618;</i><cite class="layui-icon layim-status-hide">&#xe60f;</cite>隐身</li>'
        //     , '</ul>'
        // , '</div>'
        // , '<p class="layui-layim-remark" title="{{# if(d.mine.sign){ }}{{d.mine.sign}}{{# } }}">{{ d.mine.remark||d.mine.sign||"你很懒，没有写签名" }}</p>'
        , '</div>'
        //***** -----------------自定义tabbar----wjq 2016-8-3----------------******//
        , '<ul class="layui-layim-tab">', '{{# layui.each(d.base.tabBar.list, function(index, item){ }}'

        , '<li style="{{d.base.tabBar.style}}" class="layui-icon {{# if(index==0){ }} layim-this {{# } }}" title="{{ item.title }}" ', 'layim-event="tab" lay-type="{{ item.type }}">{{ item.icon}}</li>'

        , '{{# }); }}'
        , '</ul>'

        , '<ul class="layim-tab-content {{# if(d.base.isfriend){ }}layim-show{{# } }} layim-list-friend">'
        , '{{# layui.each(d.friend, function(index, item){ var spread = d.local["spread"+index] || "true"; }}'
            , '<li>'
            , '<ul class="layui-layim-list {{# if(spread === "true"){ }}'
            , ' layim-show'
            , '{{# } }}">'
            , listTpl({
            type: "friend",
            item: "item.list",
            index: "index"
        }), '</ul>'
            , '</li>'
            , '{{# }); if(d.friend.length === 0){ }}'
            , '<li><ul class="layui-layim-list layim-show"><li class="layim-null">暂无联系人</li></ul>'
            , '{{# } }}'
            , '</ul>'
            , '{{# if(d.base.isgroup){ }}'
            , '<ul class="layim-tab-content {{# if(!d.base.isfriend && d.base.isgroup){ }}layim-show{{# } }}">'
            , '<li>'
            , '<ul class="layui-layim-list layim-show layim-list-group">'
            , listTpl({
            type: 'group'
        }), '</ul>', '</li>', '</ul>', '{{# } }}'
        /************添加系统消息 svmessage********wjq 2016-8-4*******/
        , '{{# if(d.base.issvmessage){ }}'
            , '<ul class="layim-tab-content {{# if(!d.base.isfriend && d.base.issvmessage){ }}layim-show{{# } }}">'
                , '<li>'
                    , '<ul class="layui-layim-list layim-show layim-list-svmessage">'
                        , listTpl({
                            type: 'svmessage'
                        })
                    , '</ul>'
                , '</li>'
            , '</ul>'
        , '{{# } }}'
        /****************************/
        /************添加群发消息 groupSend********wjq 2016-8-8*******/
        , '{{# if(d.base.isgroupSend){ }}', '<ul class="layim-tab-content {{# if(!d.base.isfriend && d.base.isgroupSend){ }}layim-show{{# } }}">', '<li>', '<ul class="layui-layim-list layim-show layim-list-groupSend">', listTpl({
            type: 'groupSend'
        }), '</ul>', '</li>', '</ul>', '{{# } }}'
        /****************************/
        /************添加群发消息 autoReplay********wjq 2016-8-8*******/
        , '{{# if(d.base.isautoReplay){ }}'
        , '<ul class="layim-tab-content {{# if(!d.base.isfriend && d.base.isautoReplay){ }}layim-show{{# } }}">'
        , '<li>'
        , '<ul class="layui-layim-list layim-show layim-list-autoReplay">'
        , listTpl({
            type: 'autoReplay'
        })
        , '</ul>'
        , '</li>'
        , '</ul>'
        , '{{# } }}'
        /****************************/
        /************历史消息 ishistory********wjq 2016-8-8*******/
        , '{{# if(d.base.ishistory){ }}'
        , '<ul class="layim-tab-content  {{# if(!d.base.isfriend && !d.base.ishistory){ }}layim-show{{# } }}">'
        , '<li>'
        , '<ul class="layui-layim-list layim-show layim-list-history">'
        , listTpl({
            type: 'history'
        })
        , '</ul>'
        , '</li>'
        , '</ul>'
        , '{{# } }}'
        /****************************/
        , '<ul class="layim-tab-content">'
        , '<li>'
        , '<ul class="layui-layim-list layim-show" id="layui-layim-search"></ul>'
        , '</li>'
        , '</ul>'
        // , '<ul class="layui-layim-tool">'
        // , '<li class="layui-icon layim-tool-search" layim-event="search" title="搜索">&#xe615;</li>'
        // , '<li class="layui-icon layim-tool-skin" layim-event="skin" title="换肤">&#xe61b;</li>'
        // , '{{# if(d.base.find){ }}'
        // , '<li class="layui-icon layim-tool-find" layim-event="find" title="查找">&#xe61f;</li>'
        // , '{{# } }}'
        // , '{{# if(!d.base.copyright){ }}'
        // , '<li class="layui-icon layim-tool-about" layim-event="about" title="关于">&#xe60b;</li>'
        // , '{{# } }}'
        // , '</ul>'
        // , '<div class="layui-layim-search"><input><label class="layui-icon" layim-event="closeSearch">&#x1007;</label></div>'
        , '</div>'
    ].join('');


    //换肤模版
    var elemSkinTpl = ['<ul class="layui-layim-skin">', '{{# layui.each(d.skin, function(index, item){ }}', '<li><img layim-event="setSkin" src="{{ item }}"></li>', '{{# }); }}', '<li layim-event="setSkin"><cite>默认</cite></li>', '</ul>'].join('');


    //聊天主模板
    var elemChatTpl = ['<div class="layim-chat layim-chat-{{d.data.type}}">'
        // ,'<div class="svmuuim-chat-title">正在与<span>{{ d.data.name||"佚名" }}</span>管理员聊天...</div>'
        , '<div class="layim-chat-title">'
        , '<a class="layim-chat-other">'
        , '<img src="{{ d.data.avatar.replace("images","images/headimg") }}"><span layim-event="{{ d.data.type==="group" ? \"groupMembers\" : \"\" }}">{{ d.data.name||"佚名" }} {{# if(d.data.type==="group"){ }} <em class="layim-chat-members"></em><i class="layui-icon">&#xe61a;</i> {{# } }}</span>', '</a>', '</div>'
        // 系统消息时隐藏输入框   wjq  2016-8-5
        , '<div class="layim-chat-main" style="{{d.data.type==="svmessage" ? \"height:400px;\" : \"\" }}">'
        , '<ul></ul>'
        , '</div>'
        , '<div class="layim-chat-footer" style="{{d.data.type==="svmessage" ? \"display:none;\" : \"\" }}">'
        , '<div class="layim-chat-tool" data-json="{{encodeURIComponent(JSON.stringify(d.data))}}">'
        // , '<span class="layui-icon layim-tool-face" title="选择表情" layim-event="face">&#xe60c;</span>'
        ,'<em class="icon7" title="选择表情" layim-event="face"></em>'
        // , '<span class="layui-icon layim-tool-image" title="上传图片" layim-event="image">&#xe60d;<input type="file" name="file"></span>'
        , '<em class="icon4" title="上传图片" layim-event="image"><input style="display:none" type="file" name="file"></em>'
        , '{{# if(d.base && d.base.uploadFile){ }}'
        , '<span class="layui-icon layim-tool-image" title="发送文件" layim-event="image" data-type="file">&#xe61d;<input type="file" name="file"></span>', '{{# }; }}'
        , '{{# if(d.base && d.base.chatLog){ }}'
        , '<span class="layim-tool-log" layim-event="chatLog"><em class="icon5"></em>聊天记录</span>'
        , '{{# }; }}'
        , '</div>'
        , '<div class="layim-chat-textarea"><textarea></textarea></div>'
        , '<div class="layim-chat-bottom">'
        , '<div class="layim-chat-send">'
        // , '{{# if(!d.base.brief){ }}'
        // , '<span class="layim-send-close" layim-event="closeThisChat">关闭</span>'
        // , '{{# } }}'
        , '<span class="layim-send-btn" layim-event="send">发送</span>'
        , '<span class="layim-send-set" layim-event="setSend" lay-type="show"><em class="layui-edge"></em></span>'
        , '<ul class="layui-anim layim-menu-box">'
        , '<li {{d.local.sendHotKey !== "Ctrl+Enter" ? "class=layim-this" : ""}} layim-event="setSend" lay-type="Enter"><i class="layui-icon">&#xe618;</i>按Enter键发送消息</li>'
        , '<li {{d.local.sendHotKey === "Ctrl+Enter" ? "class=layim-this" : ""}} layim-event="setSend"  lay-type="Ctrl+Enter"><i class="layui-icon">&#xe618;</i>按Ctrl+Enter键发送消息</li>'
        , '</ul>'
        , '</div>'
        , '</div>'
        , '</div>'
        , '</div>'
    ].join('');

    //聊天主模板-管理端  wjq  2016-8-8  包含群发消息及历史消息列表
    var elemChatTpl_manager = ['<div class="layim-chat layim-chat-{{d.data.type}}">'
    , '<div class="layim-chat-title">'
    , '<a class="layim-chat-other">'
    , '<img src="{{ d.data.avatar }}"><span layim-event="{{ d.data.type==="group" ? \"groupMembers\" : \"\" }}">{{ d.data.name||"佚名" }} {{# if(d.data.type==="group"){ }} <em class="layim-chat-members"></em><i class="layui-icon">&#xe61a;</i> {{# } }}</span>'
    , '</a>'
    , '</div>'
        // 群发消息时隐藏聊天面板   wjq  2016-8-8
        , '<div class="layim-chat-main" style="{{(d.data.type==="groupSend" || d.data.type==="autoReplay") ? \"display:none;\" : \"\" }}">'
        , '<ul></ul>'
        , '</div>'
        , '<div class="layim-chat-footer" style="{{(d.data.type==="groupSend" || d.data.type==="autoReplay") ? \"height:410px;\" : \"\" }}">'
        , '{{# if(d.data.type==="groupSend" || d.data.type==="autoReplay"){ }}'
        , '<div style="height: 40px;line-height: 40px;background: #ccc;padding:10px 20px;"><input type="text"  placeholder="输入你要发送的标题" style="width:90%;padding: 8px;"></div>'
        , '{{# } }}'
        , '<div class="layim-chat-tool" data-json="{{encodeURIComponent(JSON.stringify(d.data))}}">'
        , '<span class="layui-icon layim-tool-face" title="选择表情" layim-event="face">&#xe60c;</span>'
        , '<span class="layui-icon layim-tool-image" title="上传图片" layim-event="image">&#xe60d;<input type="file" name="file"></span>'
        , '{{# if(d.base && d.base.uploadFile){ }}'
        , '<span class="layui-icon layim-tool-image" title="发送文件" layim-event="image" data-type="file">&#xe61d;<input type="file" name="file"></span>'
        , '{{# }; }}'
        , '{{# if(d.base && d.base.chatLog){ }}'
        , '<span class="layim-tool-log" layim-event="chatLog"><i class="layui-icon">&#xe60e;</i>聊天记录</span>'
        , '{{# }; }}'
        , '</div>'
        , '<div class="layim-chat-textarea" style="{{(d.data.type==="groupSend" || d.data.type==="autoReplay") ? \"height: 295px;\" : \"\" }}"><textarea></textarea></div>'
        , '<div class="layim-chat-bottom">'
        , '<div class="layim-chat-send">'
        , '{{# if(!d.base.brief){ }}'
        , '<span class="layim-send-close" layim-event="closeThisChat">关闭</span>'
        , '{{# } }}'
        , '<span class="layim-send-btn" layim-event="send">发送</span>'
        , '<span class="layim-send-set" layim-event="setSend" lay-type="show"><em class="layui-edge"></em></span>'
        , '<ul class="layui-anim layim-menu-box">'
        , '<li {{d.local.sendHotKey !== "Ctrl+Enter" ? "class=layim-this" : ""}} layim-event="setSend" lay-type="Enter"><i class="layui-icon">&#xe618;</i>按Enter键发送消息</li>'
        , '<li {{d.local.sendHotKey === "Ctrl+Enter" ? "class=layim-this" : ""}} layim-event="setSend"  lay-type="Ctrl+Enter"><i class="layui-icon">&#xe618;</i>按Ctrl+Enter键发送消息</li>'
        , '</ul>', '</div>', '</div>', '</div>', '</div>'
    ].join('');

    //转换时间
    layui.laytpl.date = function(timestamp) {
        var timestamp = (timestamp+"").length == 13?timestamp:timestamp*1000;
        var time = new Date(timestamp || new Date());
        y = time.getFullYear(),
        m = time.getMonth()+1,
        d = time.getDate(),
        h = time.getHours(),
        i = time.getMinutes(),
        s = time.getSeconds();
        var ymd = y+"-"+m+"-"+d,his = h+":"+i+":"+s,temp = ymd+" "+his;
        // var _datestr = new Date(timestamp || new Date()).toLocaleString().replace(/\//g, "-");
        // var _hh = new Date(timestamp || new Date()).getHours();
        // var _hstr = _datestr.trim().split(" ")[1].split(":")[0];
        // var temp = _datestr.replace(_hstr,_hh).replace(/(\s)\D*(\d)/g, "$1$2");
        var now = new Date();
        var year = now.getFullYear();       //年
        var month = now.getMonth() + 1;     //月
        var day = now.getDate();            //日
        var _date = year+"-"+month+"-"+day;
        return ymd==_date?temp.split(" ")[1]:temp;
    };

    //转换内容
    layui.laytpl.content = function(content) {
        //支持的html标签
        var html = function(end) {
            return new RegExp('\\n*\\[' + (end || '') + '(pre|div|p|table|thead|th|tbody|tr|td|ul|li|ol|li|dl|dt|dd|h2|h3|h4|h5)([\\s\\S]*?)\\]\\n*', 'g');
        };
        content = (content || '').replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;')
            .replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;').replace(/"/g, '&quot;') //XSS
            .replace(/@(\S+)(\s+?|$)/g, '@<a href="javascript:;">$1</a>$2') //转义@
            .replace(/\s{2}/g, '&nbsp') //转义空格
            .replace(/img\[([^\s]+?)\]/g, function(img) { //转义图片
                return '<img class="layui-layim-photos" src="' + img.replace(/(^img\[)|(\]$)/g, '') + '">';
            })
            .replace(/file\([\s\S]+?\)\[[\s\S]*?\]/g, function(str) { //转义文件
                var href = (str.match(/file\(([\s\S]+?)\)\[/) || [])[1];
                var text = (str.match(/\)\[([\s\S]*?)\]/) || [])[1];
                if (!href) return str;
                return '<a class="layui-layim-file" href="' + href + '" target="_blank"><i class="layui-icon">&#xe61e;</i><cite>' + (text || href) + '</cite></a>';
            })
            .replace(/face\[([^\s\[\]]+?)\]/g, function(face) { //转义表情
                var alt = face.replace(/^face/g, '');
                return '<img alt="' + alt + '" title="' + alt + '" src="' + faces[alt] + '">';
            }).replace(/a\([\s\S]+?\)\[[\s\S]*?\]/g, function(str) { //转义链接
                var href = (str.match(/a\(([\s\S]+?)\)\[/) || [])[1];
                var text = (str.match(/\)\[([\s\S]*?)\]/) || [])[1];
                if (!href) return str;
                return '<a href="' + href + '" target="_blank">' + (text || href) + '</a>';
            }).replace(html(), '\<$1 $2\>').replace(html('/'), '\</$1\>') //转移代码
            .replace(/\n/g, '<br>') //转义换行 
        return content;
    };

    // 聊天内容模板
    var elemChatMain = [
        '{{# if(d.type === "svmessage"){ }}' // 添加系统消息处理类型  wjq 2016-8-8
            ,'{{# if(d.content){ }}'
                , '<li class="sys-message" data-id="{{ d.msg_id }}">'
                , '<h2>{{ d.title||(d.id === "999999"?"系统通知":"小秘书消息") }}'
                , '<em>{{ layui.laytpl.date(d.timestamp) }}</em>'
                , '<em class="sv-icon-close" layim-event="delsvmsg"> X </em></h2>'
                , '<h3>{{ d.content||"" }}</h3>'
                , '</li>'
            ,'{{# } else { }}'
                , '<li class="sys-message">'
                , '<h3>暂无消息</h3>'
                , '</li>'
            ,'{{# } }}'
        , '{{# } else { }}'
            , '<li {{ d.mine ? "class=layim-chat-mine" : "" }}>'
            , '<div class="layim-chat-user"><img src="{{ d.avatar }}">'
            , '{{# if(d.mine){ }}'
                , '<cite><i>{{ layui.laytpl.date(d.timestamp) }}</i>{{ d.username||"佚名" }}'
            , '{{# } else { }}'
                , '<em class="under-tip">管理</em><cite>{{ d.username||"佚名" }}<i>{{ layui.laytpl.date(d.timestamp) }}</i>'
            , '{{# } }}'
            , '</cite></div>'
            , '<div class="layim-chat-text">{{ layui.laytpl.content(d.content||"&nbsp") }}</div></li>'
        , '{{# } }}' 
    ].join('');

    var elemChatList = '<li class="layim-chatlist-{{ d.data.type }}{{ d.data.id }} layim-this" layim-event="tabChat"><img src="{{ d.data.avatar }}"><span>{{ d.data.name||"佚名" }}</span>{{# if(!d.base.brief){ }}<span class="icon6" layim-event="closeChat"></span>{{# } }}</li>';

    //Ajax
    var post = function(options, callback, tips) {
        options = options || {};
        return $.ajax({
            url: options.url,
            type: options.type || 'get',
            data: options.data,
            dataType: options.dataType || 'json',
            cache: false,
            success: function(res) {
                res.code == 0 ? callback && callback(res.data || {}) : layer.msg(res.msg || ((tips || 'Error') + ': LAYIM_NOT_GET_DATA'), {
                    time: 5000
                });
            },
            error: function(err, msg) {
                window.console && console.log && console.error('LAYIM_DATE_ERROR：' + msg);
            }
        });
    };

    //请求基础信息
    var cache = {
            message: {},
            chat: []
        },
        init = function(options) {
            var mine = options.mine || {id:options.userId},
                local = layui.data('layim')[mine.id] || {},
                obj = {
                    base: options,
                    local: local,
                    mine: mine,
                    history: local.history || {}
                };
            cache = $.extend(cache, obj);
            if (options.brief) {
                return layui.each(call.ready, function(index, item) {
                    item && item(obj);
                });
            };

            // 点击IM入口时判断是否登录  wujq  2016-9-19
            popmin();
            if (storage.uid <= 0) {
                return false;
            }
            // ------------------end----------------------

            post(options.init, function(data) {
                var mine = options.mine || data.mine || {};
                var local = layui.data('layim')[mine.id] || {},

                    obj = {
                        base: options // 基础配置信息
                        ,local: local // 本地数据
                        ,mine: mine // 粉丝信息
                        ,friend: data.friend || [] //联系人信息
                        ,group: data.group || [] //群组信息
                        ,groupSend: data.groupSend || [] //群发消息
                        ,autoReplay: data.autoReplay || [] //自动回复
                        ,svmessage: data.svmessage || [] //系统信息
                        ,history: local.history || {} //历史会话信息
                    };
                 // 保存系统消息头像及小秘书头像
                obj.svmessage[0].avatar = headimg[obj.svmessage[0].id],
                obj.svmessage[1].avatar = headimg[obj.svmessage[1].id],

                cache = $.extend(cache, obj);
                popim(laytpl(elemTpl).render(obj));
                if (local.close) {
                    popmin();
                }
                layui.each(call.ready, function(index, item) {
                    item && item(obj);
                });
            }, 'INIT');
        };

    //显示主面板
    var layimMain, popim = function(content) {

        // 若自定义IM入口 则主面板显示自定义位置，或者为右下角显示  wjq 2016-9-13
        var offset = $(cache.base.imWindow).length?cache.base.offset:"rb";

        return layer.open({
            type: 1,
            area: ['300px', '500px'],
            skin: 'layui-box layui-layim im-define-btn',
            title: '&#8203;',
            offset: offset,
            id: 'layui-layim',
            shade: false,
            moveType: 1,
            shift: 2,
            content: content,
            success: function(layero) {
                var local = layui.data('layim')[cache.mine.id] || {},
                    skin = local.skin;

                layimMain = layero;
                layimMain.css({
                    'background-image': skin ? 'url(' + skin + ')' : 'none'
                });
                if (cache.base.right) {
                    layero.css('margin-left', '-' + cache.base.right);
                }
                if (layimClose) {
                    layer.close(layimClose.attr('times'));
                }

                //按最新会话重新排列
                var arr = [],
                    historyElem = layero.find('.layim-list-history');
                    historyElem.find('li').each(function() {
                    arr.push($(this).prop('outerHTML'))
                });
                if (arr.length > 0) {
                    arr.reverse();
                    historyElem.html(arr.join(''));
                }

                banRightMenu();
            },
            cancel: function(index) {
                popmin();
                var local = layui.data('layim')[cache.mine.id] || {};
                local.close = true;
                layui.data('layim', {
                    key: cache.mine.id,
                    value: local
                });
                return false;
            }
        });
    };

    //屏蔽主面板右键菜单
    var banRightMenu = function() {
        layimMain.on('contextmenu', function(event) {
            event.cancelBubble = true
            event.returnValue = false;
            return false;
        });

        var hide = function() {
            layer.closeAll('tips');
        };

        //自定义历史会话右键菜单
        layimMain.find('.layim-list-history').on('contextmenu', 'li', function(e) {
            var othis = $(this);
            var html = '<ul data-id="' + othis[0].id + '" data-index="' + othis.data('index') + '"><li layim-event="menuHistory" data-type="one">移除该会话</li><li layim-event="menuHistory" data-type="all">清空全部会话列表</li></ul>';

            if (othis.hasClass('layim-null')) return;

            layer.tips(html, this, {
                tips: 1,
                time: 0,
                shift: 5,
                fix: true,
                skin: 'layui-box layui-layim-contextmenu',
                success: function(layero) {
                    var stopmp = function(e) {
                        stope(e);
                    };
                    layero.off('mousedown', stopmp).on('mousedown', stopmp);
                }
            });
            $(document).off('mousedown', hide).on('mousedown', hide);
            $(window).off('resize', hide).on('resize', hide);

        });
    }

    //主面板最小化状态
    var layimClose, popmin = function(content) {
        if (layimClose) {
            layer.close(layimClose.attr('times'));
        }
        if (layimMain) {
            layimMain.hide();
        }
        cache.mine = cache.mine || {};

        if($(cache.base.imWindow).length){
            // 若页面中定义IM 入口元素 则设置标记  wjq 2016-9-12
            $(cache.base.imWindow).show();
            
            $(cache.base.imWindow).on('click', function() {
                if(login_pop()){
                    layimMain.show();

                    // 如果有新消息，则同时打开主面板和聊天面板
                    if($(cache.base.imWindow).find("em.em-im-news").length){
                        $(cache.base.imWindow).find("em.em-im-news").click();
                    }

                    var local = layui.data('layim')[cache.mine.id] || {};
                    delete local.close;
                    layui.data('layim', {
                        key: cache.mine.id,
                        value: local
                    });
                }
            });

            return true;
        }

        return layer.open({
            type: 1,
            title: false,
            area: ['auto', '150px'],
            id: 'layui-layim-close',
            skin: 'layui-box layui-layim-min layui-layim-close im-define-btn sv-layer-btn',
            shade: false,
            closeBtn: false,
            shift: 2,
            // offset: ['300px', '1500px'],
            offset: 'rb',
            content: '<em style="display:block;" class="icon icon-manager"></em><div class="im-rb-service" style="color:#fff;">' + (content || cache.base.title || '联系管理') + '</div>',
            // content: '<img src="' + (cache.mine.avatar || (layui.cache.dir + 'css/pc/layim/skin/logo.jpg')) + '"><span>' + (content || cache.base.title || '联系管理') + '</span>',
            success: function(layero, index) {
                layimClose = layero;
                layero.css('margin-top', '-90px');
                if (cache.base.right) {
                    layero.css('margin-left', '-' + cache.base.right);
                }
                layero.on('click', function() {
                    if(login_pop()){
                        layer.close(index);
                        layimMain.show();

                        // 如果有新消息，则同时打开主面板和聊天面板
                        $("#layui-layim-min").click();

                        var local = layui.data('layim')[cache.mine.id] || {};
                        delete local.close;
                        layui.data('layim', {
                            key: cache.mine.id,
                            value: local
                        });
                    }
                    
                });
            }
        });
    };

    //显示聊天面板
    var layimChat, layimMin, chatIndex, To = {},
        popchat = function(data) {
            data = data || {};

            var chat = $('#layui-layim-chat'),
                render = {
                    data: data,
                    base: cache.base,
                    local: cache.local
                };

            if (!data.id) {
                return layer.msg('非法用户');
            }

            if (chat[0]) {
                var list = layimChat.find('.layim-chat-list');
                var listThat = list.find('.layim-chatlist-' + data.type + data.id);

                //如果是最小化，则还原窗口
                if (layimChat.css('display') === 'none') {
                    layimChat.show();
                }

                if (layimMin) {
                    layer.close(layimMin.attr('times'));
                }

                //如果出现多个聊天面板
                if (list.find('li').length === 1 && !listThat[0]) {
                    layimChat.css('width', '800px');
                    list.css('display', 'inline-block');
                }

                //打开的是非当前聊天面板，则新增面板
                if (!listThat[0]) {
                    list.append(laytpl(elemChatList).render(render));
                    chat.append(laytpl(elemChatTpl).render(render));
                }


                changeChat(list.find('.layim-chatlist-' + data.type + data.id));
                if (!listThat[0]) {
                    viewChatlog();
                }
                setHistory(data);
                hotkeySend();
                return chatIndex;
            }

            var index = chatIndex = layer.open({
                type: 1,
                area: ['600px', '520px'],
                skin: 'layui-box layui-layim-chat im-define-btn',
                id: 'layui-layim-chat',
                title: '&#8203;',
                shade: false,
                moveType: 1
                    // ,maxmin: true
                    ,
                closeBtn: cache.base.brief ? false : 1,
                content: laytpl('<ul class="layim-chat-list">' + elemChatList + '</ul>' + elemChatTpl).render(render),
                success: function(layero) {
                    var local = layui.data('layim')[cache.mine.id] || {};
                    var skin = local.skin;
                    layimChat = layero;
                    layimChat.css({
                        'background-image': skin ? 'url(' + skin + ')' : 'none'
                    });
                    hotkeySend();
                    setHistory(data);

                    //聊天窗口的切换监听
                    layui.each(call.chatChange, function(index, item) {
                        item && item(thisChat());
                    });

                    viewChatlog();
                    showOffMessage();

                    //查看大图
                    layero.on('click', '.layui-layim-photos', function() {
                        var ig = new Image();
                        ig.src = this.src;
                        var w = ig.width;
                        var h = ig.height;
                        if(w > 1080){
                            w = 1080;
                        }
                        var wwidth = h>w?"900px":"auto";
                        layer.close(popchat.photosIndex);
                        layer.open({
                            type: 1,
                            area: [w+'px',wwidth],
                            closeBtn: 1,
                            btns: 0,
                            moveOut: true,
                            title: false,
                            shift: 2,
                            move: 'img',
                            moveType: 2,
                            shadeClose: true, //开启遮罩关闭
                            content: '<em class="all-img">查看原图</em><img src="'+ig.src+'" style="max-width: 100%;" />',
                            success: function(a,b){
                                a.height(a.height()-5);
                                a.find("em").on("click", function(event) {
                                    window.open(a.find("img").attr("src"));
                                    return false;
                                });
                            }
                        });
                        // layer.photos({
                        //     photos: {
                        //         data: [{
                        //             "alt": "大图模式",
                        //             "src": ig.src
                        //         }]
                        //     },
                        //     shade: 0.01,
                        //     closeBtn: 2,
                        //     shift: 0,
                        //     success: function(layero, index) {
                        //         popchat.photosIndex = index;
                        //     }
                        // });
                    });
                },
                min: function() {
                    setChatMin();
                    return false;
                },
                end: function() {
                    layer.closeAll('tips');
                }
            });
            return index;
        };

    //设置聊天窗口最小化 & 新消息提醒
    var setChatMin = function(newMsg) {
        var thatChat = newMsg || thisChat().data;

        if (layimChat && !newMsg) {
            layimChat.hide();
        }
        if (layimMin) {
            layer.close(layimMin.attr('times'));
        }

        if($(cache.base.imWindow).length){
            // 若页面中定义IM 入口元素 则新消息处理  wjq 2016-9-12
            if(!$(cache.base.imWindow).find("em.em-im-news").length){
                $(cache.base.imWindow).prepend('<em class="em-im-news" style="margin-left:25px;"></em>');
            }
            
            time_two = setInterval(function(){
                $(cache.base.imWindow).find("em.em-im-news").fadeOut(500).fadeIn(500);
            },1000);
 
            $(cache.base.imWindow).delegate("em.em-im-news",'click', function() {
                window.clearInterval(time_two);
                $(this).remove();
                newMsg ? layui.each(cache.chat, function(i, item) {
                    if(item.type !== "999999"){
                         popchat(item);
                    }
                }) : layimChat.show();
                if (newMsg) {
                    cache.chat = [];
                    chatListMore();
                }
            });
            return true;
        }

        layer.open({
            type: 1,
            title: false,
            id: 'layui-layim-min',
            area:['0', '0'],
            skin: 'layui-box layui-layim-min define-btn sv-layer-minmsg',
            shade: false,
            closeBtn: false,
            zIndex: '19891015',
            shift: thatChat.shift || 1
            ,offset: 'rb' //  wjq  2016-8-8  消息提示设置为右下角
                
            ,content: '<em class="icon icon-msg"></em>'
            // '<span class="svmuu-color-red">' + thatChat.name + '</span>'
                // ,content: '<img src="'+ thatChat.avatar +'"><span>'+ thatChat.name +'</span>'
                ,
            success: function(layero, index) {
                layero.css('margin-top', '-320px');
                var time_one = setInterval(function(){
                    layero.find(".icon-msg").toggleClass("icon-nomsg");
                },1000);
                if (!newMsg) {
                    layimMin = layero;
                }
                layero.on('click', function() {
                    window.clearInterval(time_one);
                    layer.close(index);
                    newMsg ? layui.each(cache.chat, function(i, item) {
                        if(item.id !== "999999"){
                             popchat(item);
                        }
                    }) : layimChat.show();
                    if (newMsg) {
                        cache.chat = [];
                        chatListMore();
                    }
                });
            }
        });
    };

    //切换聊天
    var changeChat = function(elem, del) {
        elem = elem || $('.layim-chat-list .' + THIS);
        var index = elem.index() === -1 ? 0 : elem.index();
        var str = '.layim-chat',
            cont = layimChat.find(str).eq(index);

        // 若当前切换有消息气泡则删除相关气泡  wjq 2016-8-3
        if (elem.length > 0) {
            _tips(elem, "del");
            var _o = elem.attr("class").split(" ")[0].replace("chatlist-", "");
            _tips($("#" + _o), "del");
        }


        if (del) {
            //如果关闭的是当前聊天，则切换聊天焦点
            if (elem.hasClass(THIS)) {
                changeChat(index === 0 ? elem.next() : elem.prev());
            }

            elem.remove();
            cont.remove();

            var length = layimChat.find(str).length;

            //只剩下1个列表，隐藏左侧区块
            if (length === 1) {
                layimChat.find('.layim-chat-list').hide();
                layimChat.css('width', '600px');
            }

            //聊天列表不存在，则关闭聊天界面
            if (length === 0) {
                layer.close(chatIndex);
            }

            return false;
        }

        elem.addClass(THIS).siblings().removeClass(THIS);
        cont.css('display', 'inline-block').siblings(str).hide();
        cont.find('textarea').focus();

        //聊天窗口的切换监听
        layui.each(call.chatChange, function(index, item) {
            item && item(thisChat());
        });
        showOffMessage();
    };

    //展示存在队列中的消息
    var showOffMessage = function() {
        var thatChat = thisChat();
        var message = cache.message[thatChat.data.type + thatChat.data.id];
        if (message) {
            //展现后，删除队列中消息
            delete cache.message[thatChat.data.type + thatChat.data.id];
        }
    };

    //获取当前聊天面板
    var thisChat = function() {
        var index = $('.layim-chat-list .' + THIS).index();
        var cont = layimChat.find('.layim-chat').eq(index);
        var to = JSON.parse(decodeURIComponent(cont.find('.layim-chat-tool').data('json')));
        return {
            elem: cont,
            data: to,
            textarea: cont.find('textarea')
        };
    };

    //记录历史会话
    var setHistory = function(data) {
        // 系统消息和小秘书会话不计入历史会话当中   业务需求  wjq 2016-9-19
        if(data.type == "svmessage"){
            return true;
        }

        var local = layui.data('layim')[cache.mine.id] || {};
        var obj = {},
            history = local.history || {};
        var is = history[data.type + data.id];

        if (!layimMain) return;

        var historyElem = layimMain.find('.layim-list-history');

        data.historyTime = new Date().getTime();
        history[data.type + data.id] = data;

        local.history = history;

        layui.data('layim', {
            key: cache.mine.id,
            value: local
        });

        if (is) return;

        obj[data.type + data.id] = data;
        var historyList = laytpl(listTpl({
            type: 'history',
            item: 'd.data'
        })).render({
            data: obj
        });
        historyElem.prepend(historyList);
        historyElem.find('.layim-null').remove();
    };

    //发送消息
    var sendMessage = function() {
        var data = {
            username: cache.mine ? cache.mine.username : '访客',
            avatar: cache.mine ? cache.mine.avatar : (layui.cache.dir + 'css/pc/layim/skin/logo.jpg'),
            id: cache.mine ? cache.mine.id : null,
            mine: true
        };
        var thatChat = thisChat(),
            ul = thatChat.elem.find('.layim-chat-main ul');
        var maxLength = cache.base.maxLength || 3000;
        data.content = thatChat.textarea.val();
        if (data.content.replace(/\s/g, '') !== '') {

            if (data.content.length > maxLength) {
                return layer.msg('内容最长不能超过' + maxLength + '个字符')
            }

            // wujq  2016-10-11  自己发送的消息也走服务器端，统一系统时间
            // ul.append(laytpl(elemChatMain).render(data));

            var param = {
                    mine: data,
                    to: thatChat.data
                };
            //   var message = {
            //         username: param.mine.username,
            //         avatar: param.mine.avatar,
            //         id: param.to.id,
            //         type: param.to.type,
            //         content: param.mine.content,
            //         timestamp: new Date().getTime(),
            //         mine: true
            //     };
            // pushChatlog(message);

            layui.each(call.sendMessage, function(index, item) {
                item && item(param);
            });
        }
        chatListMore();
        thatChat.textarea.val('').focus();
    };

    //接受消息
    var getMessage = function(data) {
        data = data || {};
        var elem = $('.layim-chatlist-' + data.type + data.id);
        var group = {},
            svmessage = {},
            index = elem.index();

        data.timestamp = data.timestamp || new Date().getTime();

        pushChatlog(data);

        if (!data.mine && ((!layimChat && data.content) || index === -1)) {
            if (cache.message[data.type + data.id]) {
                cache.message[data.type + data.id].push(data)
            } else {
                cache.message[data.type + data.id] = [data];

                //记录聊天面板队列
                if (data.type === 'friend') {
                    var friend;
                    layui.each(cache.friend, function(index1, item1) {
                        layui.each(item1.list, function(index, item) {
                            if (item.id == data.id) {
                                item.type = 'friend';
                                item.name = item.username;
                                cache.chat.push(item);
                                return friend = true;
                            }
                        });
                        if (friend) return true;
                    });
                    if (!friend) {
                        // data.name = data.username + '<cite>临时会话<cite>';
                        data.name = data.username;
                        cache.chat.push(data);
                    }
                } else if (data.type === 'group') {
                    var isgroup;
                    layui.each(cache.group, function(index, item) {
                        if (item.id == data.id) {
                            item.type = 'group';
                            item.name = item.groupname;
                            cache.chat.push(item);
                            return isgroup = true;
                        }
                    });
                    if (!isgroup) {
                        data.name = data.groupname;
                        cache.chat.push(data);
                    }
                } else if (data.type === 'svmessage') {
                    /**----------系统消息处理  svmessage-  wjq  2016-8-4-------start-----**/
                    var ismessage;
                    layui.each(cache.svmessage, function(index, item) {
                        if (item.id == data.id) {
                            item.type = 'svmessage';
                            item.name = item.username;
                            cache.chat.push(item);
                            return ismessage = true;
                        }
                    });
                    if (!ismessage) {
                        data.name = data.username;
                        cache.chat.push(data);
                    }
                    /**-----------svmessage--end------------**/
                }else {
                    data.name = data.name || data.username || data.groupname;
                    cache.chat.push(data);
                }
            }

            if (data.type === 'group') {
                layui.each(cache.group, function(index, item) {
                    if (item.id == data.id) {
                        group.avatar = item.avatar;
                        return true;
                    }
                });
            }

            if(data.type=="svmessage" && data.is_read == "1"){
                return true;
            }

            // 若主面板没有打开，则弹出提示新消息，或者添加气泡
            if (layimMain.css("display") && layimMain.css("display") == "none") {
                return setChatMin({
                    name: '收到新消息',
                    avatar: group.avatar || data.avatar,
                    shift: 1
                });
            } else {
                // 主板列表 layim-friend100001
                if($("#layim-" + data.type + data.id).length){ 
                    // 优先在圈子里面找到对应的圈主
                    _tips($("#layim-" + data.type + data.id), "add");
                    $(".layui-layim-tab").find("li").each(function() {
                        if ($(this).attr("lay-type") == data.type && $(this).find("em").length == 0) {
                            _tips($(this), "add");
                        }
                    });
                }else{
                    // 或者查找历史聊天列表中的圈主并进行标示  wjq 2016-9-29
                    if($("#layim-history"+ data.id).length){
                        _tips($("#layim-history"+ data.id), "add");
                        var _histab = $(".layui-layim-tab").find("li[lay-type='history']");
                        if (_histab && _histab.find("em").length == 0) {
                            _tips(_histab, "add");
                        }
                    }else{
                        // 若当前历史聊天中也没有此人，则添加  wujq 2016-10-14
                        setHistory(data);
                        _tips($("#layim-history"+ data.id), "add");
                        var _histab = $(".layui-layim-tab").find("li[lay-type='history']");
                        if (_histab && _histab.find("em").length == 0) {
                            _tips(_histab, "add");
                        }
                    }
                }
                return true;
            }
                     
        }

        //接受到的消息不在当前Tab
        var thatChat = thisChat();
        if (thatChat.data.type + thatChat.data.id !== data.type + data.id) {
            elem.addClass('layui-anim layer-anim-06');
            setTimeout(function() {
                elem.removeClass('layui-anim layer-anim-06')
            }, 300);
            // 新消息添加提示气泡  wjq  2016-8-3
            _tips(elem, "add");
            // 主板列表 layim-friend100001
            _tips($("#layim-" + data.type + data.id), "add");
            $(".layui-layim-tab").find("li").each(function() {
                if ($(this).attr("lay-type") == data.type && $(this).find("em").length == 0) {
                    _tips($(this), "add");
                }
            });
        }

        var cont = layimChat.find('.layim-chat').eq(index);
        var ul = cont.find('.layim-chat-main ul');
        if (data.content.replace(/\s/g, '') !== '') {
            // 系统消息 小秘书消息特殊处理
            if(data.type === "svmessage"){
                ul.prepend(laytpl(elemChatMain).render(data));
            }else{
                ul.append(laytpl(elemChatMain).render(data));
            }
        }
        chatListMore();
    };

    //存储最近30条聊天记录到本地
    var pushChatlog = function(message) {
        var local = layui.data('layim')[cache.mine.id] || {};
        var chatlog = local.chatlog || {};

        // 第一次加载 清除历史系统消息  wujq  2018-8-24
        if(sv_load_flag === 0){
            delete chatlog.svmessage999999;
            delete chatlog.svmessage999998;
            sv_load_flag++;
        }
        // 系统新消息替换默认头像
        if(message.type === 'svmessage'){
            message.avatar = headimg[message.id];
        }

        if (chatlog[message.type + message.id]) {
            // 清除相同message
            var arr = chatlog[message.type + message.id];
            for(var i in arr){
                if(message.msg_id && message.msg_id == arr[i].msg_id) return true;
            }

            chatlog[message.type + message.id].push(message);
            if (chatlog[message.type + message.id].length > 30) {
                chatlog[message.type + message.id].shift();
            }
        } else {
            chatlog[message.type + message.id] = [message];
        }
        local.chatlog = chatlog;
        layui.data('layim', {
            key: cache.mine.id,
            value: local
        });
    };

    //渲染本地最新聊天记录到相应面板
    var viewChatlog = function() {
        var local = layui.data('layim')[cache.mine.id] || {};
        var thatChat = thisChat(),
            chatlog = local.chatlog || {};
        var ul = thatChat.elem.find('.layim-chat-main ul');

        //  若无系统消息的时候 消息面板显示暂无消息记录   wujq  2016-8-25 
        if(chatlog[thatChat.data.type + thatChat.data.id]){
            layui.each(chatlog[thatChat.data.type + thatChat.data.id], function(index, item) {
                // 系统消息 小秘书消息特殊处理
                if(thatChat.data.type === "svmessage"){
                    ul.prepend(laytpl(elemChatMain).render(item));
                }else{
                    ul.append(laytpl(elemChatMain).render(item));
                }
            });
            chatListMore();
        }else{
            ul.remove("li").append('<li class="layim-chat-system"><span style="font-size: 14px;margin-left: -70px;">暂无消息记录</span></li>');
        }

        
    };

    //添加好友或群
    var addList = function(data) {
        var listElem = layimMain.find('.layim-list-' + data.type);
        var obj = {},
            has;
        if (cache[data.type]) {
            if (data.type === 'friend') {
                layui.each(cache.friend, function(index, item) {
                    if (data.groupid == item.id) {
                        //检查好友是否已经在列表中
                        layui.each(cache.friend[index].list, function(idx, itm) {
                            if (itm.id == data.id) {
                                return has = true
                            }
                        });
                        if (has) return layer.msg('好友 [' + (data.username || '') + '] 已经存在列表中', {
                            shift: 6
                        });
                        cache.friend[index].list = cache.friend[index].list || [];
                        obj[cache.friend[index].list.length] = data;
                        data.groupIndex = index;
                        cache.friend[index].list.push(data); //在cache的friend里面也增加好友
                        return true;
                    }
                });
            } else if (data.type === 'group') {
                //检查群组是否已经在列表中
                layui.each(cache.group, function(idx, itm) {
                    if (itm.id == data.id) {
                        return has = true
                    }
                });
                if (has) return layer.msg('您已是 [' + (data.groupname || '') + '] 的群成员', {
                    shift: 6
                });
                obj[cache.group.length] = data;
                cache.group.push(data);
            }
        }

        if (has) return;

        var list = laytpl(listTpl({
            type: data.type,
            item: 'd.data',
            index: data.type === 'friend' ? 'data.groupIndex' : null
        })).render({
            data: obj
        });

        if (data.type === 'friend') {
            var li = listElem.find('>li').eq(data.groupIndex);
            li.find('.layui-layim-list').append(list);
            li.find('.layim-count').html(cache.friend[data.groupIndex].list.length); //刷新好友数量
            //如果初始没有好友
            if (li.find('.layim-null')[0]) {
                li.find('.layim-null').remove();
            }
        } else if (data.type === 'group') {
            listElem.append(list);
            //如果初始没有群组
            if (listElem.find('.layim-null')[0]) {
                listElem.find('.layim-null').remove();
            }
        }
    };

    //移出好友或群
    var removeList = function(data) {
        var listElem = layimMain.find('.layim-list-' + data.type);
        var obj = {};
        if (cache[data.type]) {
            if (data.type === 'friend') {
                layui.each(cache.friend, function(index1, item1) {
                    layui.each(item1.list, function(index, item) {
                        if (data.id == item.id) {
                            var li = listElem.find('>li').eq(index1);
                            var list = li.find('.layui-layim-list>li');
                            li.find('.layui-layim-list>li').eq(index).remove();
                            cache.friend[index1].list.splice(index, 1); //从cache的friend里面也删除掉好友
                            li.find('.layim-count').html(cache.friend[index1].list.length); //刷新好友数量  
                            //如果一个好友都没了
                            if (cache.friend[index1].list.length === 0) {
                                li.find('.layui-layim-list').html('<li class="layim-null">该分组下已无好友了</li>');
                            }
                            return true;
                        }
                    });
                });
            } else if (data.type === 'group') {
                layui.each(cache.group, function(index, item) {
                    if (data.id == item.id) {
                        listElem.find('>li').eq(index).remove();
                        cache.group.splice(index, 1); //从cache的group里面也删除掉数据
                        //如果一个群组都没了
                        if (cache.group.length === 0) {
                            listElem.html('<li class="layim-null">暂无群组</li>');
                        }
                        return true;
                    }
                });
            }
        }
    };

    //查看更多记录
    var chatListMore = function() {
        var thatChat = thisChat(),
            chatMain = thatChat.elem.find('.layim-chat-main');
        var ul = chatMain.find('ul');
        if (ul.find('li').length >= 30) {
            if (!ul.prev().hasClass('layim-chat-system')) {
                ul.before('<div class="layim-chat-system"><span layim-event="chatLog">查看更多记录</span></div>');
            }
        }

        // 若是系统消息或小秘书  则滚动到顶部  wujq  2016-09-19
        if(thatChat.data.id == "999998" || thatChat.data.id == "999999"){
            chatMain.scrollTop(0);
        }else{
            chatMain.scrollTop(chatMain[0].scrollHeight);
            chatMain.find('ul li:last').find('img').load(function() {
                chatMain.scrollTop(chatMain[0].scrollHeight);
            }); 
        }
        
    };

    //快捷键发送
    var hotkeySend = function() {
        var thatChat = thisChat(),
            textarea = thatChat.textarea;
        textarea.focus();
        textarea.off('keydown').on('keydown', function(e) {
            var local = layui.data('layim')[cache.mine.id] || {};
            var keyCode = e.keyCode;
            if (local.sendHotKey === 'Ctrl+Enter') {
                if (e.ctrlKey && keyCode === 13) {
                    sendMessage();
                }
                return;
            }
            if (keyCode === 13) {
                if (e.ctrlKey) {
                    return textarea.val(textarea.val() + '\n');
                }
                if (e.shiftKey) return;
                e.preventDefault();
                sendMessage();
            }
        });
    };

    //表情库
    var faces = function() {
        var alt = ["[微笑]", "[嘻嘻]", "[哈哈]", "[可爱]", "[可怜]", "[挖鼻]", "[吃惊]", "[害羞]", "[挤眼]", "[闭嘴]", "[鄙视]", "[爱你]", "[泪]", "[偷笑]", "[亲亲]", "[生病]", "[太开心]", "[白眼]", "[右哼哼]", "[左哼哼]", "[嘘]", "[衰]", "[委屈]", "[吐]", "[哈欠]", "[抱抱]", "[怒]", "[疑问]", "[馋嘴]", "[拜拜]", "[思考]", "[汗]", "[困]", "[睡]", "[钱]", "[失望]", "[酷]", "[色]", "[哼]", "[鼓掌]", "[晕]", "[悲伤]", "[抓狂]", "[黑线]", "[阴险]", "[怒骂]", "[互粉]", "[心]", "[伤心]", "[猪头]", "[熊猫]", "[兔子]", "[ok]", "[耶]", "[good]", "[NO]", "[赞]", "[来]", "[弱]", "[草泥马]", "[神马]", "[囧]", "[浮云]", "[给力]", "[围观]", "[威武]", "[奥特曼]", "[礼物]", "[钟]", "[话筒]", "[蜡烛]", "[蛋糕]"],
            arr = {};
        layui.each(alt, function(index, item) {
            arr[item] = layui.cache.dir + 'images/face/' + index + '.gif';
        });
        return arr;
    }();

    //组件事件冒泡
    var stope = function(e) {
        e = e || window.event;
        e.stopPropagation ? e.stopPropagation() : e.cancelBubble = true;
    };

    //在焦点处插入内容
    var focusInsert = function(obj, str) {
        var result, val = obj.value;
        obj.focus();
        if (document.selection) { //ie
            result = document.selection.createRange();
            document.selection.empty();
            result.text = str;
        } else {
            result = [
                val.substring(0, obj.selectionStart),
                str,
                val.substr(obj.selectionEnd)
            ];
            obj.focus();
            obj.value = result.join('');
        }
    };

    //事件
    var anim = 'layui-anim-up',
        events = {
            //在线状态
            status: function(othis, e) {
                var hide = function() {
                    othis.next().hide().removeClass(anim);
                };
                var type = othis.attr('lay-type');
                if (type === 'show') {
                    stope(e);
                    othis.next().show().addClass(anim);
                    $(document).off('click', hide).on('click', hide);
                } else {
                    var prev = othis.parent().prev();
                    othis.addClass(THIS).siblings().removeClass(THIS);
                    prev.html(othis.find('cite').html());
                    prev.removeClass('layim-status-' + (type === 'online' ? 'hide' : 'online'))
                        .addClass('layim-status-' + type);
                    layui.each(call.online, function(index, item) {
                        item && item(type);
                    });
                }
            }

            //大分组切换
            ,
            tab: function(othis) {
                var index, main = '.layim-tab-content';
                var tabs = layimMain.find('.layui-layim-tab>li');
                typeof othis === 'number' ? (
                    index = othis, othis = tabs.eq(index)
                ) : (
                    index = othis.index()
                );
                index > 2 ? tabs.removeClass(THIS) : (
                    events.tab.index = index, othis.addClass(THIS).siblings().removeClass(THIS)
                    // ,_tips(othis,"del") //  点击查看主页面板tab切换消息，气泡消失--- wjq 2016-8-3
                )
                layimMain.find(main).eq(index).addClass(SHOW).siblings(main).removeClass(SHOW);
            }

            //展开联系人分组
            ,
            spread: function(othis) {
                var type = othis.attr('lay-type');
                var spread = type === 'true' ? 'false' : 'true';
                var local = layui.data('layim')[cache.mine.id] || {};
                othis.next()[type === 'true' ? 'removeClass' : 'addClass'](SHOW);
                local['spread' + othis.parent().index()] = spread;
                layui.data('layim', {
                    key: cache.mine.id,
                    value: local
                });
                othis.attr('lay-type', spread);
                othis.find('.layui-icon').html(spread === 'true' ? '&#xe61a;' : '&#xe602;');
            }

            //搜索
            ,
            search: function(othis) {
                var search = layimMain.find('.layui-layim-search');
                var main = layimMain.find('#layui-layim-search');
                var input = search.find('input'),
                    find = function(e) {
                        var val = input.val().replace(/\s/);
                        if (val === '') {
                            events.tab(events.tab.index | 0);
                        } else {
                            var data = [],
                                friend = cache.friend || [];
                            var group = cache.group || [],
                                html = '';
                            for (var i = 0; i < friend.length; i++) {
                                for (var k = 0; k < (friend[i].list || []).length; k++) {
                                    if (friend[i].list[k].username.indexOf(val) !== -1) {
                                        friend[i].list[k].type = 'friend';
                                        friend[i].list[k].index = i;
                                        friend[i].list[k].list = k;
                                        data.push(friend[i].list[k]);
                                    }
                                }
                            }
                            for (var j = 0; j < group.length; j++) {
                                if (group[j].groupname.indexOf(val) !== -1) {
                                    group[j].type = 'group';
                                    group[j].index = j;
                                    group[j].list = j;
                                    data.push(group[j]);
                                }
                            }
                            if (data.length > 0) {
                                for (var l = 0; l < data.length; l++) {
                                    html += '<li layim-event="chat" data-type="' + data[l].type + '" data-index="' + data[l].index + '" data-list="' + data[l].list + '"><img src="' + data[l].avatar + '"><span>' + (data[l].username || data[l].groupname || '佚名') + '</span><p>' + (data[l].remark || data[l].sign || '') + '</p></li>';
                                }
                            } else {
                                html = '<li class="layim-null">无搜索结果</li>';
                            }
                            main.html(html);
                            events.tab(3);
                        }
                    };
                if (!cache.base.isfriend && cache.base.isgroup) {
                    events.tab.index = 1;
                } else if (!cache.base.isfriend && !cache.base.isgroup) {
                    events.tab.index = 2;
                }
                search.show();
                input.focus();
                input.off('keyup', find).on('keyup', find);
            }

            //关闭搜索
            ,
            closeSearch: function(othis) {
                othis.parent().hide();
                events.tab(events.tab.index | 0);
            }

            //弹出换肤
            ,
            skin: function() {
                layer.open({
                    type: 1,
                    title: '换肤',
                    shade: false,
                    area: '300px',
                    skin: 'layui-box layui-layer-border define-btn',
                    id: 'layui-layim-skin',
                    zIndex: 66666666,
                    content: laytpl(elemSkinTpl).render({
                        skin: cache.base.skin
                    })
                });
            }

            //弹出查找页面
            ,
            find: function() {
                layer.open({
                    type: 2,
                    title: '查找',
                    shade: false,
                    area: ['1000px', '520px'],
                    skin: 'layui-box layui-layer-border define-btn',
                    id: 'layui-layim-find',
                    content: cache.base.find
                });
            }

            //关于
            ,
            about: function() {
                layer.alert('版本： ' + v + '<br>版权所有：<a href="http://layim.layui.com" target="_blank">layim.layui.com</a>', {
                    title: '关于 LayIM',
                    shade: false
                });
            }

            //生成换肤
            ,
            setSkin: function(othis) {
                var src = othis.attr('src');
                var local = layui.data('layim')[cache.mine.id] || {};
                local.skin = src;
                if (!src) delete local.skin;
                layui.data('layim', {
                    key: cache.mine.id,
                    value: local
                });
                try {
                    layimMain.css({
                        'background-image': src ? 'url(' + src + ')' : 'none'
                    });
                    layimChat.css({
                        'background-image': src ? 'url(' + src + ')' : 'none'
                    });
                } catch (e) {}
            }

            //弹出聊天面板
            ,
            chat: function(othis) {
                var local = layui.data('layim')[cache.mine.id] || {};
                var type = othis.data('type'),
                    index = othis.data('index');
                var list = othis.attr('data-list') || othis.index(),
                    data = {};
                if (type === 'friend') {
                    data = cache[type][index].list[list];
                } else if (type === 'group') {
                    data = cache[type][list];
                } else if (type === 'svmessage') {
                    data = cache[type][list];
                } else if (type === 'groupSend') {
                    data = cache[type][list];
                } else if (type === 'autoReplay') {
                    data = cache[type][list];
                } else if (type === 'history') {
                    data = (local.history || {})[index] || {};
                }
                data.name = data.name || data.username || data.groupname || data.actname;
                if (type !== 'history') {
                    data.type = type;
                }
                // 点击主面板，去除新消息气泡
                _tips(othis, "del");

                popchat(data);
            }

            //切换聊天
            ,
            tabChat: function(othis) {
                changeChat(othis);
            }

            //关闭聊天列表
            ,
            closeChat: function(othis) {
                changeChat(othis.parent(), 1);
            },
            closeThisChat: function() {
                changeChat(null, 1);
            }

            //展开群组成员
            ,
            groupMembers: function(othis, e) {
                var icon = othis.find('.layui-icon'),
                    hide = function() {
                        icon.html('&#xe61a;');
                        othis.data('down', null);
                        layer.close(events.groupMembers.index);
                    },
                    stopmp = function(e) {
                        stope(e)
                    };

                if (othis.data('down')) {
                    hide();
                } else {
                    icon.html('&#xe619;');
                    othis.data('down', true);
                    events.groupMembers.index = layer.tips('<ul class="layim-members-list"></ul>', othis, {
                        tips: 3,
                        time: 0,
                        shift: 5,
                        fix: true,
                        skin: 'layui-box layui-layim-members',
                        success: function(layero) {
                            var members = cache.base.members || {},
                                thatChat = thisChat();
                            var li = '';
                            members.data = $.extend(members.data, {
                                id: thatChat.data.id
                            });
                            post(members, function(res) {
                                layui.each(res.list, function(index, item) {
                                    li += '<li><a><img src="' + item.avatar + '"></a><p>' + item.username + '</p></li>';
                                });
                                layero.find('.layim-members-list').html(li);
                                layui.each(call.members, function(index, item) {
                                    item && item(res);
                                });
                                othis.find('.layim-chat-members').html((res.list || []).length + '人');
                            });
                            layero.on('mousedown', function(e) {
                                stope(e);
                            });
                        }
                    });
                    $(document).off('mousedown', hide).on('mousedown', hide);
                    $(window).off('resize', hide).on('resize', hide);
                    othis.off('mousedown', stopmp).on('mousedown', stopmp);

                }
            }

            //发送聊天内容
            ,
            send: function() {
                sendMessage();
            }

            //设置发送聊天快捷键
            ,
            setSend: function(othis, e) {
                var box = othis.siblings('.layim-menu-box'),
                    hide = function() {
                        box.hide().removeClass(anim);
                    };
                var type = othis.attr('lay-type');
                if (type === 'show') {
                    stope(e);
                    box.show().addClass(anim);
                    $(document).off('click', hide).on('click', hide);
                } else {
                    othis.addClass(THIS).siblings().removeClass(THIS);
                    var local = layui.data('layim')[cache.mine.id] || {};
                    local.sendHotKey = type;
                    layui.data('layim', {
                        key: cache.mine.id,
                        value: local
                    });
                }
            }

            //表情
            ,
            face: function(othis, e) {
                var content = '',
                    thatChat = thisChat(),
                    hide = function() {
                        layer.close(events.face.index);
                    };

                for (var key in faces) {
                    content += '<li title="' + key + '"><img src="' + faces[key] + '"></li>';
                }
                content = '<ul class="layui-clear layim-face-list">' + content + '</ul>';

                events.face.index = layer.tips(content, othis, {
                    tips: 1,
                    time: 0,
                    fix: true,
                    skin: 'layui-box layui-layim-face',
                    success: function(layero) {
                        layero.find('.layim-face-list>li').on('mousedown', function(e) {
                            stope(e);
                        }).on('click', function() {
                            focusInsert(thatChat.textarea[0], 'face' + this.title + ' ');
                            layer.close(events.face.index);
                        });
                    }
                });

                $(document).off('mousedown', hide).on('mousedown', hide);
                $(window).off('resize', hide).on('resize', hide);
                stope(e);
            }

            //图片或一般文件
            ,
            image: function(othis) {
            //点击选择图片
                othis.find('input')[0].click();
                var type = othis.data('type') || 'images',
                    api = {
                        images: 'uploadImage',
                        file: 'uploadFile'
                    };
                var thatChat = thisChat(),
                    upload = cache.base[api[type]] || {};

                layui.upload({
                    url: upload.url || '',
                    method: upload.type,
                    file: othis.find('input')[0],
                    unwrap: true,
                    check: type,
                    success: function(res) {
                        if(res.indexOf('error') != -1){
                            layer.msg(res.split("|")[1]);
                            return;
                        }
                        res = {"code":0,"type":"images","data":{"src":res}};
                        // try {
                        //     res = JSON.parse(res);
                        // } catch (e) {
                        //     res = {};
                        //     return layer.msg('请对上传接口返回JSON字符');
                        // }
                        if (res.code == 0) {
                            res.data = res.data || {};
                            if (type === 'images') {
                                focusInsert(thatChat.textarea[0], 'img[' + (res.data.src || '') + ']');
                            } else if (type === 'file') {
                                focusInsert(thatChat.textarea[0], 'file(' + (res.data.src || '') + ')[' + (res.data.name || '下载文件') + ']');
                            }
                        } else {
                            layer.msg(res.msg || '上传失败');
                        }
                    }
                });
            }

            //聊天记录
            ,
            chatLog: function(othis) {
                var thatChat = thisChat();

                // 系统消息记录  打开新页面查看更多   wujq  2016-8-24
                chatMain = thatChat.elem.find('.layim-chat-main');
                var ul = chatMain.find('ul');
                var first = ul.find('li').eq(0);

                if(first.attr("class") && first.attr("class").indexOf("message") > -1){
                    window.open("/account/notice");
                    return false;
                }

                if (!cache.base.chatLog) {
                    return layer.msg('未开启更多聊天记录');
                }
                layer.close(events.chatLog.index);
                return events.chatLog.index = layer.open({
                    type: 2,
                    maxmin: false,
                    title: '与 ' + thatChat.data.name + ' 的聊天记录',
                    area: ['450px', '100%'],
                    shade: false,
                    offset: 'rb',
                    skin: 'layui-box define-btn',
                    shift: 2,
                    id: 'layui-layim-chatlog',
                    // content: cache.base.chatLog + '?id=' + thatChat.data.id + '&type=' + thatChat.data.type
                    content: cache.base.chatLog + '?mine_uid=' + cache.base.userId + '&to_uid=' + thatChat.data.id
                });
            }

            //历史会话右键菜单操作
            ,
            menuHistory: function(othis, e) {
                    var local = layui.data('layim')[cache.mine.id] || {};
                    var parent = othis.parent(),
                        type = othis.data('type');
                    var hisElem = layimMain.find('.layim-list-history');
                    var none = '<li class="layim-null">暂无历史会话</li>'

                    if (type === 'one') {
                        var history = local.history;
                        delete history[parent.data('index')];
                        local.history = history;
                        layui.data('layim', {
                            key: cache.mine.id,
                            value: local
                        });
                        $('#' + parent.data('id')).remove();
                        if (hisElem.find('li').length === 0) {
                            hisElem.html(none);
                        }
                    } else if (type === 'all') {
                        delete local.history;
                        layui.data('layim', {
                            key: cache.mine.id,
                            value: local
                        });
                        hisElem.html(none);
                    }

                    layer.closeAll('tips');
                }
                // 自定义查看系统消息详情事件
                ,
            msgdetail: function(othis) {
                var id = othis.data('id');
                alert("open====" + id);
            }
            ,delsvmsg: function(othis){
                var local = layui.data('layim')[cache.mine.id] || {};
                var _id = othis.parents("li").attr('data-id');
                var loading = layer.load();
                $.ajax({
                    type: 'post',
                    url: '/account/delnotice',
                    data: {nid: _id},
                    dataType: 'json',
                    success: function(r){
                        layer.close(loading);
                        layer.msg(r.message);
                        othis.parents("li").remove();
                        // 删除本地存储
                        var chatlog = local.chatlog || {};
                        layui.each(chatlog.svmessage999998, function(index, item) {
                            if(item.msg_id == _id){
                                chatlog.svmessage999998.splice(index, 1);
                            }
                        });
                        layui.each(chatlog.svmessage999999, function(index, item) {
                            if(item.msg_id == _id){
                                chatlog.svmessage999999.splice(index, 1);
                            }
                        });
                        local.chatlog = chatlog;
                        layui.data('layim', {
                            key: cache.mine.id,
                            value: local
                        });
                    },
                    error: function(e){
                        layer.close(loading);
                        console.log(e);
                    }
                });
            }

        };


    /**===================== 自定义方法 ====================**/
    // 弹框登录
    var login_pop = function(){
        if (storage.uid <= 0) {
            storage.pop_log_reg = layer.open({
                type: 2,
                skin: 'login-reg-class',
                title: false, //不显示标题
                content:['/gonghui/account/poplogin/'],
                area: ['620px', '450px'],
                shade: [0.25],
                bgcolor :'#fff',
                closeBtn  : 0
            });
            return false;
        }
        return true;
    };

    //添加删除消息气泡  act:"add"添加，"del"删除
    var _tips = function(elem, act) {
        if (act == "del") {
            if (elem.find("em.tips").length > 0) {
                elem.find("em.tips").remove();
                // 判断是否全部清除，若是则清除主板tab上的气泡
                var _elem = elem.attr("data-type");
                $(".layui-layim-tab").find("li").each(function() {
                    if (_elem && _elem==$(this).attr("lay-type")) {
                        $(this).find("em.tips").remove();
                        return false;
                    }
                });

            }
        } else if (act == "add" && elem.find("em.tips").length == 0) {
            elem.append('<em class="tips"></em>');
            // var _xy = elem.find(":last-child").offset();
            // var _top = _xy.top,_left = _xy.left;
            // elem.find("em.tips").css("top","10px").css("left","100px");
        }
    };


    //暴露接口
    exports('layim', new LAYIM());

}).addcss(
    'pc/layim/layim.css?v=2.083', 'skinlayimcss'
);