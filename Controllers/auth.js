const jwt = require('jsonwebtoken')
const User = require('../Models/User')
// route to sign in user and sending token
//
// req.body = {
//   email,
//   password
// }
//
// sends -> {success, token, message}
exports.signin = async (req, res) => {
  const { email, password } = req.body
  try {
    const user = await User.findOne({ email }).select({ password: 1 })
    if (!user || !user.validatePassword(password)) {
      res.send({ success: false, message: 'invalid credentials' })
      return
    }

    const token = jwt.sign({ id: user['_id'] }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXP,
    })
    res
      .cookie('token', token, {
        expires: new Date(
          Date.now() + process.env.JWT_COOKIE_EXP * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
      })
      .send({ success: true, token })
  } catch (err) {
    res.send({ success: false, message: err.message })
  }
}

// route to signing up and adding user to database
//
//  req.body = {
//   name,
//   username,
//   email,
//   password
// }
//
// sends -> {success: Boolean, message, token }
exports.signup = async (req, res) => {
  try {
    const user = await User.create(req.body)
    const token = jwt.sign({ id: user['_id'] }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXP,
    })
    res.send({ success: true, message: 'Account created successfully', token })
  } catch (err) {
    if (err.code == 11000) {
      err.message = 'user already registered, Please sign in to continue'
    }
    res.send({ success: false, message: err.message })
  }
}

// route to sign out and clear cookies
// sends -> {success:true , message}
exports.signout = async (req, res) => {
  res.clearCookie('token')
  res.send({ success: true, message: 'Signed out' })
}

//route to change password
// for signed in users
// req.body = {
//  oldPassword,
//  newPassword
// }
//
// sends -> {success:Boolean,message}
exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body
  try {
    const user = await User.findById(req.userId).select({ password: 1 })
    if (!user || !user.validatePassword(oldPassword)) {
      return res.send({ success: false, message: 'invalid credentials' })
    }
    user.password = newPassword
    await user.save()
    res.send({ success: true, message: 'password changed' })
  } catch (err) {
    res.send({ success: false, message: err.message })
  }
}

// route to check existing user
//
// req.body= {
//  username
//}
//
// sends -> { success: true , message, exists}
exports.userExists = async (req, res) => {
  const { username } = req.body
  try {
    const user = await User.findOne({ username })
    if (!user) {
      return res.send({ success: true, exists: false })
    }
    return res.send({ success: true, exists: true })
  } catch (err) {
    res.send({ success: false, message: err.message })
  }
}
