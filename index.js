const express = require('express')
const app = express()
const mongoose = require('mongoose');
const passport = require('passport');
const bodyParser = require('body-parser')
const cookieSession = require('cookie-session')
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const Task = require('./models/task-schema')
const User = require('./models/user-model')
const methodOverride = require('method-override')

app.set('view engine', 'ejs')

mongoose.connect('mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false', { useNewUrlParser: true, useUnifiedTopology: true }, () => {
  console.log('connected to mongodb')
})

app.use(bodyParser.urlencoded({ extended: false }))
app.use(methodOverride('_method'));

app.use(cookieSession({
  maxAge: 24 * 60 * 60 * 1000,
  keys: ['asdfadf']
}))

const isLoggedIn = (req, res, next) => {
  if (req.user) {
    next();
  }
  else {
    res.sendStatus(401)
  }
}

app.use(passport.initialize());
app.use(passport.session())

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id).then((user) => {
    done(null, user);
  })
});

passport.use(new GoogleStrategy({
  clientID: '915897639761-i3ntj9de3tjd2dut9nnbm70th0nn59il.apps.googleusercontent.com',
  clientSecret: 'L0IkZri8_lfGwsAKfw1bGY1g',
  callbackURL: "http://localhost:3000/google/callback"
},
  function (accessToken, refreshToken, profile, done) {
    console.log(profile);
    User.findOne({ googleId: profile.id }).then((currentUser) => {
      if (currentUser) {

        done(null, currentUser)
      } else {
        new User({
          username: profile.displayName,
          googleId: profile.id,
          thumbnail: profile._json.picture
        }).save().then((newUser) => {

          done(null, newUser)
        })
      }
    })
  }
));


app.get('/', (req, res) => {
  res.render('home');
})

app.get('/google',
  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login'] }));


app.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function (req, res) {
    res.redirect('/logged');
  });

app.get('/logged', isLoggedIn, async (req, res) => {

  const user2 = await User.findOne({ googleId: req.user.googleId }).populate({ path: 'list', model: Task })

  res.render('logged', { user: user2 })
})

app.post('/logged', isLoggedIn, (req, res) => {

  const t = new Task({
    title: req.body.username,
  })
  t.save()
    .then(() => {
      User.findOne({ googleId: req.user.googleId })
        .then(user => {
          user.save(user.list.push(t))
        })
        .catch()
      res.redirect('/logged')
    })
    .catch(err => console.log(err))

})

app.delete('/logged/:id', async (req, res) => {
  await Task.findByIdAndRemove(req.params.id)
  await User.findOneAndUpdate(
    { googleId: req.user.googleId },
    { $pullAll: { list: [req.params.id] } },
    { new: true },
    (err, data) => {
      if (err) {
        console.log(err)
      }
    }
  )
  res.redirect('/logged')
});

app.get('/logout', (req, res) => {
  req.session = null;
  req.logout();
  res.redirect('/')
})

app.listen(3000, () => {
  console.log("server started")
})