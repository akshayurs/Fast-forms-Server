const jwt = require('jsonwebtoken')
const User = require('../Models/User')
const fetch = require('node-fetch')
const {
  sendMail,
  accountConfirmTemplate,
  passwordResetTemplate,
} = require('../Helpers/email')

// route to sign in user and sending token
//
// req.body = {
//   email,
//   password
// }
//
// returns -> {success, token, message}
exports.signin = async (req, res) => {
  const { username, password } = req.body
  try {
    const user = await User.findOne({
      $or: [{ username }, { email: username }],
    }).select({ password: 1, verified: 1 })
    if (!user || !user.validatePassword(password)) {
      res
        .status(401)
        .send({ success: false, status: 401, message: 'Invalid credentials' })
      return
    }
    if (!user.verified) {
      return res
        .status(400)
        .send({ success: false, status: 400, message: 'Account not verified' })
    }

    const token = jwt.sign({ id: user['_id'] }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXP,
    })
    res
      .status(200)
      .cookie('token', token, {
        expires: new Date(
          Date.now() + process.env.JWT_COOKIE_EXP * 24 * 60 * 60 * 1000
        ),
        sameSite: 'none',
        path: '/',
        secure: true,
        httpOnly: true,
      })
      .send({ success: true, status: 200, token })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
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
// returns -> {success: Boolean, message, token }
exports.signup = async (req, res) => {
  try {
    const response = await fetch(
      'https://open.kickbox.io/v1/disposable/' + req.body.email
    )

    if (response.status === 200) {
      const data = await response.json()
      if (data.disposable) {
        return res.status(400).send({
          success: false,
          status: 400,
          message: 'please provide your original email',
        })
      }
    }
    const user = await User.create(req.body)
    const token = jwt.sign(
      { notVerifiedUser: user['_id'] },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_VERIFY_EXP,
      }
    )
    sendMail(
      user.email,
      'Confirm your email address',
      accountConfirmTemplate(
        `${process.env.SITE_URL}/verify/${token}`,
        user.name
      )
    )
    res.status(200).send({
      success: true,
      status: 200,
      message: 'Account created successfully',
    })
  } catch (err) {
    if (err.code == 11000) {
      err.message = 'user already registered, Please sign in to continue'
    }
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

// route to sign out and clear cookies
// returns -> {success:true , message}
exports.signout = async (req, res) => {
  res.clearCookie('token', {
    sameSite: 'none',
    path: '/',
    secure: true,
    httpOnly: true,
  })
  res.status(200).send({ success: true, status: 200, message: 'Signed out' })
}

//route to change password
// for signed in users
// req.body = {
//  oldPassword,
//  newPassword
// }
//
// returns -> {success:Boolean,message}
exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body
  try {
    const user = await User.findById(req.userId).select({ password: 1 })
    if (!user || !user.validatePassword(oldPassword)) {
      return res
        .status(401)
        .send({ success: false, status: 401, message: 'Invalid credentials' })
    }
    user.password = newPassword
    await user.save()
    res
      .status(200)
      .send({ success: true, status: 200, message: 'password changed' })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

//route to reset password
//
//req.body = {
//  username //username or email
//}
// returns - > {success, status,message}
exports.resetPasswordReq = async (req, res) => {
  const { username } = req.body
  try {
    let objectId = null
    if (
      typeof username == 'string' &&
      (username.length == 24 || username.length == 12)
    ) {
      objectId = mongodb.ObjectId(username)
    }
    const user = await User.findOne({
      $or: [{ email: username }, { username }, { _id: objectId }],
    })
    //user not found
    if (!user) {
      return res
        .status(404)
        .send({ success: false, status: 404, message: 'Not found' })
    }
    const token = jwt.sign(
      { passwordResetUser: user['_id'] },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_PASSWORD_RESET_EXP,
      }
    )
    sendMail(
      user.email,
      'Reset Your Password',
      passwordResetTemplate(
        `${process.env.SITE_URL}/resetpassword/${token}`,
        user.name
      )
    )
    res.status(200).send({ success: true, status: 200, message: 'email sent' })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

//route to check password request token
// returns -> {success, status, message}
exports.checkResetToken = async (req, res) => {
  const { token } = req.params
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (decoded.passwordResetUser) {
      return res
        .status(200)
        .send({ success: true, status: 200, message: 'valid token' })
    } else {
      return res
        .status(401)
        .send({ success: false, status: 401, message: 'Invalid token' })
    }
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

//
//route to reset password with reset password token
// res.body = {
//   token,
//   password
// }
// returns -> {success,message}
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (!decoded.passwordResetUser) {
      return res
        .status(401)
        .send({ success: false, status: 401, message: 'Invalid token' })
    }

    let user = await User.findById(decoded.passwordResetUser)
    if (!user) {
      return res
        .status(404)
        .send({ success: false, status: 404, message: 'Invalid user id' })
    }
    user.password = password
    await user.save()
    return res.status(200).send({
      success: true,
      status: 200,
      message: 'password reset successful',
    })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

// route to check existing user
//
// req.body= {
//  username
//}
//
// returns -> { success: true, status, message, exists}
exports.userExists = async (req, res) => {
  const { username } = req.params
  try {
    const user = await User.findOne({ username })
    if (!user) {
      return res.status(404).send({ success: false, status: 404 })
    }
    return res.status(200).send({ success: true, status: 200 })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

// route to verify account
// returns -> {success,message}
exports.verifyAccount = async (req, res) => {
  const { token } = req.params
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const { notVerifiedUser } = decoded
    const user = await User.findById(notVerifiedUser)
    console.log(user)
    if (!user || user.verified) {
      return res
        .status(404)
        .send({ success: false, status: 404, message: 'Invalid id' })
    }
    user.verified = true
    await user.save()
    res
      .status(200)
      .send({ success: true, status: 200, message: 'account verified' })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

// route to get user details
// returns -> {success, user, message}
exports.myDetails = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select({
      username: 1,
      name: 1,
      email: 1,
    })
    if (!user) {
      res
        .status(404)
        .send({ success: false, status: 404, message: 'Not found' })
      return
    }
    res.send({ success: true, status: 200, message: 'Your details', user })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

// route to modify user
//
// req.body = {
//    field1: value1,
//    field2: value2,...
// }
//
// returns -> { success,message}
exports.modifyDetails = async (req, res) => {
  const { username, name, email } = req.body
  const userId = req.userId

  try {
    let user = await User.findById(userId)

    if (!user) {
      return res
        .status(404)
        .send({ success: false, status: 404, message: 'Not found' })
    }

    if (email) {
      const response = await fetch(
        'https://open.kickbox.io/v1/disposable/' + req.body.email
      )

      if (response.status === 200) {
        const data = await response.json()
        if (data.disposable) {
          return res.status(400).send({
            success: false,
            status: 400,
            message: 'please provide your original email',
          })
        }
      }
      user.email = email
    }
    if (username) {
      const existingUser = await User.findOne({ username })
      if (existingUser) {
        throw new Error('username not available')
      }
      user.username = username
    }
    if (name) user.name = name
    await user.save()
    console.log(user)
    res
      .status(200)
      .send({ success: true, status: 200, message: 'Details Updated' })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

//route to check login
// return -> {succuss, status, message}
exports.checkToken = (req, res) => {
  res.status(200).send({ success: true, status: 200, message: 'token valid' })
}
