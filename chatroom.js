//http://www.tettori.net/post/852/#t4
//モジュールを取得している
var http     = require("http"); //http関連のモジュールを取得
var socketio = require("socket.io"); //ソケット通信
var fs       = require("fs");//ファイルの読み書き
var port     = process.env.PORT || 3000;

// ここがポイントです
// サーバー実装の前に、エラーハンドリングを記載します。
process.on('uncaughtException', function(err) {
    console.log(err);
});
 
//Webサーバを立ち上げる
var server = http.createServer(function(req, res) {
     //起動直後にhttpヘッダに書き込む内容
     res.writeHead(200, {"Content-Type":"text/html"});
     var output = fs.readFileSync("./index.html", "utf-8");
     //index.htmlを表示
     res.end(output);
     //2014-3-20この場所をherokuで通信出来るように変更
}).listen(port);
//listen(process.env.VMC_APP_PORT || 3000);//webサーバで利用するportを自動で選択（リモート or ローカル）
 
//サーバとソケットを結びつける
var io = socketio.listen(server);
 
//2014-3-20これを入れないと、herokuでwebsocketが使えない模様
io.configure(function(){
      io.set('transports', ['xhr-polling']);
          io.set('polling duration', 10);
});

//クライアントからアクションを受け取る窓口
//socketにはクライアントからのアクションが入っている
io.sockets.on("connection", function (socket) {
  // メッセージ送信（送信者にも送られる）
  //C_to_Smessageはイベント名
  socket.on("C_to_S_message", function (data) {
    //自分を含む全ての人に送信
    io.sockets.emit("S_to_C_message", {value:data.value});
  });
 
  // ブロードキャスト（送信者以外の全員に送信）
  socket.on("C_to_S_broadcast", function (data) {
    //自分以外の人に送信
    socket.broadcast.emit("S_to_C_message", {value:data.value});
  });

  //何を打ち込んでも、必ずHelloと返してしまう
  socket.on("C_to_S_hellomessage", function (data) {
    //helloと返すだけ
    socket.broadcast.emit("S_to_C_message", {value:data.value});
  });
 
  // 切断したときに送信
  // connect, message, disconnectは予め用意されているイベント
  socket.on("disconnect", function () {
    //    io.sockets.emit("S_to_C_message", {value:"user disconnected"});
  });
});


