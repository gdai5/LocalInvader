/**
 * Module dependencies.
 */
var express = require('express');
var routes = require('./routes');
//これを追加することで、ページ毎に読み込んでくるroutesの中を分けた
var chat = require('./routes/chatroom');
var geo = require('./routes/gelocation_test');
var game = require('./routes/game');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var socketio = require("socket.io");

//ソケット通信
var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser({
    uploadDir : "./uploads"
}));
app.use(express.methodOverride());
//ここでpublicディレクトリ利用設定
app.use(express.static(path.join(__dirname, 'public')));
//mongodb
var mongoose = require('mongoose');
mongoose.connect('mongodb://hiraro:2580wktk@oceanic.mongohq.com:10054/local_invader', function(err) {
    if (err) {
        console.error(err);
        process.exit(1);
    }
});
//セッション関係
//mongodbにストアしてます
var MongoStore = require('connect-mongo')(express);
app.use(express.cookieParser('secretdeathyo!'));
app.use(express.session({
    key : 'sid',
    secret : 'secretdeathyo!',
    store : new MongoStore({
        db : 'local_invader',
        host : 'oceanic.mongohq.com',
        port : 10054,
        username : 'hiraro',
        password : '2580wktk'
    })
}));
app.use(app.router);
//クロスサイトリクエストフォージェリ対策
app.use(express.csrf());


// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

//routes/index.jsを見に行っている
app.get('/', routes.index);
app.get('/chatroom', chat.chatroom);
app.get('/gelocation_test', geo.gelocation_test);
app.get('/users', user.list);
app.get('/game', game.main);
app.get('/game/form', game.testForm);
app.post('/game/form', game.testFormPost);

//ここでサーバを立ち上げている
var server = http.createServer(app).listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});

//ここがポイントです
//サーバー実装の前に、エラーハンドリングを記載します。
process.on('uncaughtException', function(err) {
    console.log(err);
});

//サーバとソケットを結びつける
var io = socketio.listen(server);

//クライアントからアクションを受け取る窓口
//socketにはクライアントからのアクションが入っている
io.sockets.on("connection", function(socket) {
    //メッセージ送信（送信者にも送られる）
    //C_to_Smessageはイベント名
    socket.on("C_to_S_message", function(data) {
        //自分を含む全ての人に送信
        io.sockets.emit("S_to_C_message", {
            value : data.value
        });
    });

    //ブロードキャスト（送信者以外の全員に送信）
    socket.on("C_to_S_broadcast", function(data) {
        //自分以外の人に送信
        socket.broadcast.emit("S_to_C_message", {
            value : data.value
        });
    });

    //何を打ち込んでも、必ずHelloと返してしまう
    socket.on("C_to_S_hellomessage", function(data) {
        //helloと返すだけ
        //このように表記している理由はクライアントで{value:data}と渡している
        //つまりこっちでは受け取った引数の形(例えば sample_dataなら sample_data.valueに必要なデータが入っている)
        socket.broadcast.emit("S_to_C_message", {
            value : data.value
        });
    });

    //緯度と経度を全てのユーザに伝える
    //
    socket.on("C_to_S_location", function(data) {
        io.sockets.emit("S_to_C_location", data);
    });

    //切断したときに送信
    //connect, message, disconnectは予め用意されているイベント
    socket.on("disconnect", function() {
        //alert("disconnect from server");
        io.sockets.emit("S_to_C_message", {
            value : "user disconnected"
        });
    });
});

//socket.ioの設定
io.set("heartbeats", true);
//ゲームに関するメッセージング
var game = io.of("/game");
game.on("connection", function(socket) {
    //参加時の処理…
    var sessid = socket.transport.sessid;

    socket.on("locationUpdate", function(data) {
        //位置情報定期更新
        socket.broadcast.emit("locationUpdate", data);
    }).on("newPlayer", function(data, callback) {
        //プレイヤー参加
        socket.broadcast.emit("newPlayer", data);
        callback();
    }).on("playerDie", function(data) {
        //プレイヤー死亡
    }).on("newTarget", function(data) {
        //新エリア出現
    }).on("clearTarget", function(data) {
        //エリア消滅
    }).on("disconnect", function() {
        //死亡予告
        socket.broadcast.emit("playerDie", {
            id : sessid
        });
    });
});

