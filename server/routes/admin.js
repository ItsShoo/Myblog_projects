const express = require ('express');
const router = express.Router();
const Post = require('../models/Post')
const User = require('../models/User')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose');

const adminLayout = '../views/layouts/admin.ejs';   
const jwtSecret = process.env.JWT_SECRET

/**
 * 
 * check login
*/ 
const authMiddleware = (req,res,next) =>{
    const token = req.cookies.token;

    if(!token){
        return res.status(401).json({ message: 'Unauthorized'})
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.userId = decoded.userId;
        next()
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized'})
    }
}

/**
 * GET/
 * Admin - login page
*/ 

    router.get('/admins', async (req, res) => {
        try {
        const locals = {
            title: "Admin",
            description: "Simple Blog created with NodeJs, Express & MongoDb."
        }
    
        res.render('admins/index', { locals, layout: adminLayout });
        } catch (error) {
        console.log(error);
        }
    });

/**
 * Post/
 * Admin - check Login
*/ 

router.post('/admins', async (req, res) => {
    try {
        const { username , password} = req.body;

        const user = await User.findOne({ username });

        if(!user){
            return res.status(401).json({ message: 'invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if(!isPasswordValid){
            return res.status(401).json({ message: 'invalid credentials' });
        }

        const token = jwt.sign({userId: user._id},jwtSecret);
        res.cookie('token', token,{ httpOnly:true})
        res.redirect('/dashboard');

        } catch (error) {
        console.log(error);
    }
});

/**
 * GET/
 * Admin-Dashboard
*/ 

router.get('/dashboard',authMiddleware, async (req, res) => {
    try {
        const locals = {
            title: 'Dashboard',
            description: 'Simple Blog created with NodeJs, Express & MongoDb.'
          }
        const data = await Post.find();
        res.render('admins/dashboard',{
            locals,
            data,
            layout: adminLayout
        })
    } catch (error) {
        console.log(error)
    }
});

/**
 * GET/
 * Admin-create new post
*/ 

router.get('/add-post',authMiddleware, async (req, res) => {
    try {
        const locals = {
            title: 'Add post',
            description: 'Simple Blog created with NodeJs, Express & MongoDb.'
          }
        const data = await Post.find();
        res.render('admins/add-post',{
            locals,
            layout: adminLayout
        })
    } catch (error) {
        console.log(error)
    }
});

/**
 * POST/
 * Admin-create new post
*/ 

router.post('/add-post',authMiddleware, async (req, res) => {
    try {
        try {
            const newPost = new Post({
                title: req.body.title,
                body: req.body.body
            })
            // save the new post to mongodb
            await Post.create(newPost)
            res.redirect('/dashboard')
        } catch (error) {
            console.log(error)
        }

    } catch (error) {
        console.log(error)
    }
});

/**
 * GET/
 * Admin-Edit post
*/ 

router.get('/edit-post/:id', authMiddleware, async (req, res) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).send('Invalid ID');
    }
  
    try {
      const locals = {
        title: 'Edit Post',
        description: 'Free NodeJs User Management System',
      };
  
      const data = await Post.findOne({ _id: req.params.id });
      if (!data) {
        return res.status(404).send('Post not found');
      }
  
      res.render('admin/edit-post', {
        locals,
        data,
        layout: adminLayout
      });
  
    } catch (error) {
      console.log(error);
    }
  });

/**
 * GET/
 * Admin-Edit post
*/ 

  router.put('/edit-post/:id', authMiddleware, async (req, res) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).send('Invalid ID');
    }
  
    try {
      await Post.findByIdAndUpdate(req.params.id, {
        title: req.body.title,
        body: req.body.body,
        updatedAt: Date.now()
      });
  
      res.redirect(`/edit-post/${req.params.id}`);
  
    } catch (error) {
      console.log(error);
    }
  });

/**
 * Post/
 * Admin - Register
*/ 

router.post('/register', async (req, res) => {
    try {
      const { username, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
  
      try {
        const user = await User.create({ username, password:hashedPassword });
        res.status(201).json({ message: 'User Created', user });
      } catch (error) {
        if(error.code === 11000) {
          res.status(409).json({ message: 'User already in use'});
        }
        res.status(500).json({ message: 'Internal server error'})
      }
  
    } catch (error) {
      console.log(error);
    }
  });

/**
 * DELETE /
 * Admin - Delete Post
*/

  router.delete('/delete-post/:id', authMiddleware, async (req, res) => {

    try {
      await Post.deleteOne( { _id: req.params.id } );
      res.redirect('/dashboard');
    } catch (error) {
      console.log(error);
    }
  
  });

  /**
 * GET /
 * Admin Logout
*/
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    // res.json({ message: 'Logout successful.'});
    res.redirect('/');
  });

module.exports = router;