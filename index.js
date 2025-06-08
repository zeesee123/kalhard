const express=require('express');
const app=express();
const path=require('path');

const routes=require('./routes/web');

require('dotenv').config();

app.set('view engine','ejs');

// Middleware to parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Optional: If you expect JSON requests too
app.use(express.json());

app.use('/admin/assets',express.static(path.join(__dirname,'public')));

app.get('/admin',(req,res)=>{

    res.render('dashboard');
});

app.get('/admin/home',(req,res)=>{

    res.render('homepage');
});

app.post('/admin/test',(req,res)=>{
    setTimeout(() => {
        res.send('<h1>Form Submitted</h1>');
      }, 1500); // 1.5s delay
})

// hello
app.listen(process.env.PORT,()=>{
    console.log('the server is listening');
});


