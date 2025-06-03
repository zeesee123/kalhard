const express=require('express');
const router=express.Router();


router.get('/', (req, res) => {
    res.render('dashboard');
  });
  
  router.get('/login', (req, res) => {
    res.render('login');
  });
  
  router.post('/login', (req, res) => {
    // login logic here
    res.redirect('/admin');
  });
  
  router.get('/logout', (req, res) => {
    // logout logic here
    res.redirect('/admin/login');
  });
  
module.exports=router;