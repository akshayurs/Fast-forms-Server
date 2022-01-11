const express = require('express')
const router = express.Router()

const { isAuthorized, getUserId } = require('./Helpers/middleware')

const {
  signin,
  signup,
  signout,
  changePassword,
  userExists,
} = require('./Controllers/auth')

const {
  createPoll,
  modifyPoll,
  viewPoll,
  deletePoll,
} = require('./Controllers/question')

const { submitAnswer } = require('./Controllers/answer')

//auth routes
router.post('/signin', signin)
router.post('/signup', signup)
router.post('/signout', signout)
router.post('/userexists', userExists)
router.post('/changepassword', isAuthorized, changePassword)

// poll routes
router.post('/createpoll', isAuthorized, createPoll)
router.post('/modifypoll', isAuthorized, modifyPoll)
router.post('/viewpoll', getUserId, viewPoll)
router.post('/deletepoll', isAuthorized, deletePoll)

// answer routes
router.post('/submitanswer', submitAnswer)

module.exports = router
