const express=require('express');
const app=express();
const path=require('path');

const routes=require('./routes/web');

require('dotenv').config();

app.set('view engine','ejs');

app.use('/admin/assets',express.static(path.join(__dirname,'public')));

app.get('/admin',(req,res)=>{

    res.render('dashboard');
});

app.get('/admin/home',(req,res)=>{

    res.render('homepage');
});

// hello
app.listen(process.env.PORT,()=>{
    console.log('the server is listening');
});


