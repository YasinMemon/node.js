const cookieParser = require("cookie-parser");
const express = require("express");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userModel = require('./models/user');
const postModel = require('./models/post');

const app = express();

app.set("view engine", 'ejs');
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

app.get("/", (req,res) => {
    res.render("index");
});

app.post("/register", async (req,res) => {
    const { fullname, username, dob, email, password } = req.body;
    // console.log(req.body);
    

    const user = await userModel.findOne({email});
    if(user) return res.status(500).send("user already exist with this email id");
    
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            let createdUser = await userModel.create({
                fullname,
                username,
                dob,
                email,
                password: hash,
            });
            
            let token = jwt.sign({email, id: createdUser._id}, "secretKey");
            res.cookie('token', token);
            res.render('login');
        });
    });
});

app.get('/login', async (req,res) => {
    res.render("login");
})

app.post('/login', async (req,res) => {
    const { email, password } = req.body

    const user = await userModel.findOne({email});
    if(!user) return res.status(404).send("User not found");

    bcrypt.compare(password, user.password, (err, result) => {
        if(result){
            let token = jwt.sign({email, id: user._id}, "secretKey");
            res.cookie('token', token);
            return res.status(200).redirect("/homepage");
        } 
        else return res.status(404).send("User not found");
    });
});


app.get('/logout', async (req,res) => {
    res.cookie('token', "");
    res.render('index');
});

app.get('/homepage', isLoggedIn, async (req,res) => {
    let user = await userModel.findOne({email: req.user.email}).populate('posts');
    // user.populate("posts");
    res.render("homepage", {user});
});

app.post('/post', isLoggedIn, async (req,res) => {
    let user = await userModel.findOne({email: req.user.email});
    // console.log(user);
    
    if(!user) return res.send("User not found");
    const { content } = req.body;

    let post = await postModel.create({
        user,
        content
    });

    user.posts.push(post._id);
    await user.save();
    res.redirect('/homepage');
});

app.get("/like/:id", isLoggedIn, async (req,res) => {
    let post = await postModel.findOne({_id: req.params.id}).populate('user');
    console.log(req.user);
    // res.redirect('/homepage');

    if(post.likes.indexOf(req.user.id) === -1){
        post.likes.push(req.user.id);
    }else{
        post.likes.splice(post.likes.indexOf(req.user.id), 1);
    }

    await post.save();
    res.redirect('/homepage');
});

app.get('/edit/:id', async (req,res) => {
    let post = await postModel.findOne({_id: req.params.id}).populate('user');
    res.render("edit", {post});
});

app.post('/update/:id', async (req,res) => {
    let newPost = await postModel.findOneAndUpdate({_id: req.params.id}, {content: req.body.content});
    res.redirect('/home')
})

function isLoggedIn(req,res,next){
    const token = req.cookies.token;
    if (!token) return res.redirect("/login");
    try {
        let data = jwt.verify(token, "secretKey");
        req.user = data;
        next();
    } catch (err) {
        return res.redirect("/login");
    }
}

app.listen(3000);