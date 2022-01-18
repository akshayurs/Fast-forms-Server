const express = require('express')
const router = express.Router()

const { isAuthorized, getUserId, checkAdmin } = require('./Helpers/middleware')

const {
  signin,
  signup,
  signout,
  changePassword,
  userExists,
  verifyAccount,
  resetPasswordReq,
  checkResetToken,
  resetPassword,
} = require('./Controllers/auth')

const {
  createPoll,
  modifyPoll,
  viewPrevPolls,
  viewPoll,
  deletePoll,
} = require('./Controllers/question')

const {
  submitAnswer,
  viewAnswers,
  viewPrevAns,
  saveDraftAns,
  viewDraftAns,
} = require('./Controllers/answer')

const admin = require('./Controllers/admin')

router.get('/', (req, res) => {
  res.status(200).send({ success: true, message: 'fast forms server running' })
})

//auth routes
router.post('/signin', signin)
router.post('/signup', signup)
router.get('/signout', signout)
router.get('/userexists', userExists)
router.post('/changepassword', isAuthorized, changePassword)
router.get('/verify/:token', verifyAccount)
router.post('/resetPasswordReq', resetPasswordReq)
router.get('/resetpassword/:token', checkResetToken)
router.post('/resetpassword', resetPassword)

// poll routes
router.post('/poll', isAuthorized, createPoll)
router.put('/poll', isAuthorized, modifyPoll)
router.get('/poll', getUserId, viewPoll)
router.delete('/poll', isAuthorized, deletePoll)

// answer routes
router.post('/answer', getUserId, submitAnswer)
router.get('/answers', isAuthorized, viewAnswers)
router.get('/userans', isAuthorized, viewPrevAns)
router.get('/userpolls', isAuthorized, viewPrevPolls)
router.post('/draft', isAuthorized, saveDraftAns)
router.get('/draft', isAuthorized, viewDraftAns)

//admin routes
router.post('/admin/signin', admin.signin)
router.delete('/admin/poll', isAuthorized, checkAdmin, admin.deletePoll)
router.put('/admin/poll', isAuthorized, checkAdmin, admin.modifyPoll)
router.get('/admin/poll', isAuthorized, checkAdmin, admin.viewPoll)
router.get('/admin/polls', isAuthorized, checkAdmin, admin.getPolls)
router.get('/admin/userpolls', isAuthorized, checkAdmin, admin.viewPrevPolls)
router.get('/admin/answer', isAuthorized, checkAdmin, admin.viewAnswers)
router.post('/admin/answer', isAuthorized, checkAdmin, admin.submitAnswer)
router.delete('/admin/answer', isAuthorized, checkAdmin, admin.deleteAnswer)
router.put('/admin/answer', isAuthorized, checkAdmin, admin.modifyAnswer)
router.get('/admin/userans', isAuthorized, checkAdmin, admin.viewPrevAns)
router.get('/admin/getusers', isAuthorized, checkAdmin, admin.getUsers)
router.delete('/admin/user', isAuthorized, checkAdmin, admin.deleteUser)
router.put('/admin/user', isAuthorized, checkAdmin, admin.modifyUser)
router.get('/admin/user', isAuthorized, checkAdmin, admin.viewUser)

module.exports = router
