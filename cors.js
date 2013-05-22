var cors_proxy = require("corsproxy");
var http_proxy = require("http-proxy");
cors_proxy.options = {
     target: "http://localhost:3188"
};
http_proxy.createServer(cors_proxy).listen(3184);
