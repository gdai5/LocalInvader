var fs = require('fs');
var mongoose = require('mongoose');

exports.main = function(req, res) {
    res.render('game_main', {});
};
exports.testForm = function(req, res) {
    res.render('game_form');
};
exports.testFormPost = function(req, res) {
    var errors = [];
    var e = __validateImageData(req);
    if (e) {
        errors.push(e);
    } else {
        var iconFile = req.files.icon;
        var binIcon = fs.readFileSync(iconFile.path);
        var encodedIcon = new Buffer(binIcon).toString("base64");
        var dataUriIcon = "data:" + iconFile.type + ";base64," + encodedIcon;
    }
    var e = __validate(req);
    if (e) {
        errors.push(e);
    } else {
        var postData = req.body;
        req.session.name = postData.name;
        req.session.icon = dataUriIcon;
        var user = new User({
            name : postData.name,
            icon : dataUriIcon
        });
        user.save();
        res.render('game_form_done', {
            name : postData.name,
            icon : dataUriIcon
        });
    }
    if (errors.length > 0) {
        res.render('game_form', {
            name : postData.name,
            icon : dataUriIcon,
            errors : errors
        });
    }
};
var __validate = function(req) {
    var postData = req.body;
    if (!postData.name || !req.files.icon) {
        return "no name";
    }
};

var __validateImageData = function(req) {
    var iconFile = req.files.icon;
    if (!iconFile) {
        return "no image";
    }
    if (iconFile.type != "image/jpeg" && iconFile.type != "image/gif" && iconFile.type != "image/png") {
        return "invalid image type";
    }
};

var userSchema = mongoose.Schema({
    name : String,
    icon : String
});
userSchema.methods.speak = function() {
    var greeting = this.name ? "Meow name is " + this.name : "I don't have a name";
    console.log(greeting);
};
var User = mongoose.model('User', userSchema);
var __saveUserData = function() {

};
