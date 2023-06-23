//! ----------------------------IMPORTED CONTENT----------------------------IMPORTED CONTENT----------------------------IMPORTED CONTENT----------------------------
// *(((((((((((((((dotenv is user for key encryption)))))))))))))))

require('dotenv').config();
const express=require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require("express-session");
const passport= require('passport');
const passportLocalMongoose =  require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");



// const bcrypt=require('bcrypt');
//* salting rounds for encryption
// saltRounds=10;

//!----------------------------------------------------------------------

//! -------------------------------app creation-----------------------

const app=express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ 
    extended: true 
}));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
    
}));

app.use(passport.initialize());
app.use(passport.session());

//! --------------------------------MONGOOOSE portion for Backend storage-----------------------------

//* (mongoose connection)
mongoose.connect(process.env.MONGO_URI,{useNewUrlParser: true});

//* mongoose schema details
const userSchema=new mongoose.Schema({
    email : String,
    password : String,
    googleId: String,
    secret: String
});

//*this code is used for creating hashing+salting with salting rounds
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//*mongoose model
const User=new mongoose.model("User",userSchema);

//*this code  creates a local  login strategy.
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null ,user.id);
});
  
passport.deserializeUser(function(id, done) {
   User.findById(id)
  .then(user => {
    // Process the user object
    done(null,user);
  })
  .catch(err => {
    // Handle error
    console.error(err);
  });

});

passport.use(new GoogleStrategy ({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://expensive-smock-dog.cyclic.app/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//!------------------------------------------------------------------------------

// !-----------------------------------API REQUEST-----------------------------
app.get("/",function(req,res){
    res.render("home");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

 app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    //  Successful authentication.
    res.redirect('/secrets');
   });

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.
    render("register");
});

app.get("/secrets",function(req,res){
    User.find({"secret": {$ne: null}} )
        .then(foundUsers=>{
            if(foundUsers){
                res.render("secrets", {usersWithSecrets: foundUsers});
            }
        })
        .catch(err=>{
            console.log(err);
        })
     
});

app.get("/submit",function(req,res){
    if(req.isAuthenticated()) {
        res.render("submit");
    }else{
        res.redirect("/login");
    }
});

app.get("/logout", function(req, res){
    req.logout(function(err) {
        if (err) { console.log(err); }
        res.redirect('/');
      });
})

app.post("/register",function(req,res){


   //todo ---------------------------------using passport---------------------
    //*this is included in passport-local-mongoose
    User.register({username: req.body.username}, req.body.password, function(err, user) {
            if (err) {
                console.log(err);
                res.redirect('/register');
            }else{
                passport.authenticate("local")(req,res,function(){
                    res.redirect("/secrets");
                })
            }
        });  


    //todo ---------------------------------------------------------------------
   


    //todo ------------------------------using bcrypt and mongoose--------------------
    // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    //      Store hash in your password DB.
    //     const newUser=new User({
    //         email: req.body.username,
    //         password: hash
    //     });
    //     newUser.save()
    //     .then(
    //       result=>{
    //         if(newUser.email!==""){
    //            res.render("secrets");
    
    //         }
    //       })
    //     .catch(err=>{
    //         console.log(err);
    //     });
         
    // });
 //todo ------------------------------------------------------------


});


app.post("/login",function(req,res){

 //todo -----------------------------using passport-------------------------
const user=new User({

    username: req.body.username,
    password: req.body.password

});
//*to authenticate the user details with the server(IMPORTED from pass)

 //todo-------------------------------------------------------------------
    req.login(user, function(err) {
        if (err) {
            console.log(err);    
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });
 //todo ----------------------using bcypt and mongoose---------------------    
    // const username=req.body.username;
    // const password=req.body.password;

    // User.findOne({email : username})
    //  .then((foundUser)=>{
    //     if(foundUser){
    //         bcrypt.compare(password, foundUser.password, function(err, result) {
    //             if(result === true) {
    //                 res.render("secrets");
    //             };
    //         })
    //     }
    //  })
    //  .catch((err)=>{
    //      console.log(err);
    //  });
 //todo -----------------------------------------------------------------


});
app.post("/submit",function(req,res){

    const submittedSecret= req.body.secret;

    User.findById(req.user.id)
        .then(foundUser => {
            if(foundUser){
                foundUser.secret = submittedSecret;
                foundUser.save()
                        .then(() => {
                            res.redirect("/secrets");
                        });
            }
        })
        .catch(err => {
            console.log(err);
        });

});


//!------------------------------------------------------------------------------

app.listen(PORT,function(){
    console.log("Run the server on the HTTPS port (3000)" );
});; // Run the server on the HTTPS port (3000)
