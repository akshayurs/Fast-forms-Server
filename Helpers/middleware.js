const jwt = require('jsonwebtoken')
exports.isAuthorized = (req, res, next) => {
  let token = null
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1]
    } else if (req.cookies.token) {
      token = req.cookies.token
    }

    if (token == null || token == '') {
      return res.send('NOT AUTHORIZED')
    }

    req.userId = jwt.verify(token, process.env.JWT_SECRET).id
  } catch (e) {
    return res.send('Invalid Token')
  }
  next()
}

exports.getUserId = (req, res, next) => {
  let token = null
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1]
    } else if (req.cookies.token) {
      token = req.cookies.token
    }

    if (token != null && token != '')
      req.userId = jwt.verify(token, process.env.JWT_SECRET).id
  } catch (e) {
    req.userId = null
  }
  next()
}
