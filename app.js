// ----------------------------IMPORTED CONTENT----------------------------IMPORTED CONTENT----------------------------IMPORTED CONTENT----------------------------
// (((((((((((((((dotenv is user for key encryption)))))))))))))))
require('dotenv').config();
const express=require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt=require('mongoose-encryption');


// -------------------------------app creation-----------------------

const app=express();
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ 
    extended: true 
}));


// --------------------------------MONGOOOSE portion for Backend storage-----------------------------

// (mongoose connection)
mongoose.connect("mongodb://127.0.0.1:27017/userDB",{useNewUrlParser: true});
// mongoose schema details
const userSchema=new mongoose.Schema({
    email : String,
    password : String
});

// encrypt password only regardless of any other options. email and _id will be left unencrypted
userSchema.plugin(encrypt, { secret: process.env.SECRET ,encryptedFields: ['password']});

// This adds _ct and _ac fields to the schema, as well as pre 'init' and pre 'save' middleware,
// and encrypt, decrypt, sign, and authenticate instance methods

//mongoose model
const User=new mongoose.model("User",userSchema);

// -----------------------------------API REQUEST-----------------------------
app.get("/",function(req,res){
    res.render("home");
});
app.get("/login",function(req,res){
    res.render("login");
});
app.get("/register",function(req,res){
    res.render("register");
});


app.post("/register",function(req,res){
    const newUser=new User({
        email: req.body.username,
        password: req.body.password
    });
    newUser.save()
    .then(
      result=>{
        if(newUser.email!==""){
           res.render("secrets");

        }
      })
    .catch(err=>{
        console.log(err);
    });
     
});


app.post("/login",function(req,res){
const username=req.body.username;
const password=req.body.password;

User.findOne({email : username})
 .then((foundUser)=>{
    if(foundUser.password === password &&username !== ""){
        res.render("secrets")
    }
    
 })
 .catch((err)=>{
     console.log(err);
 });
});


app.listen(3000,function(){
    console.log("listening on port  3000" );
})