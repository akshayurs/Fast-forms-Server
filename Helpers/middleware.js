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
      return res
        .status(401)
        .send({ success: false, status: 401, message: 'Not Authorized' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.id
    req.isAdmin = decoded.isAdmin
  } catch (e) {
    return res
      .status(401)
      .send({ success: false, status: 401, message: 'Invalid Token' })
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
    if (token != null && token != '') {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.userId = decoded.id
      req.isAdmin = decoded.isAdmin
    }
  } catch (e) {
    req.userId = null
  }
  next()
}

exports.checkAdmin = (req, res, next) => {
  if (!req.isAdmin) {
    return res
      .status(401)
      .send({ success: false, message: 'You are not Admin' })
  }
  next()
}
