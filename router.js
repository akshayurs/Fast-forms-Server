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

//auth routes
router.post('/signin', signin)
router.post('/signup', signup)
router.post('/signout', signout)
router.post('/userexists', userExists)
router.post('/changepassword', isAuthorized, changePassword)
router.get('/verify/:token', verifyAccount)
router.post('/resetPasswordReq', resetPasswordReq)
router.get('/resetpassword/:token', checkResetToken)
router.post('/resetpassword', resetPassword)

// poll routes
router.post('/createpoll', isAuthorized, createPoll)
router.post('/modifypoll', isAuthorized, modifyPoll)
router.post('/viewpoll', getUserId, viewPoll)
router.post('/deletepoll', isAuthorized, deletePoll)

// answer routes
router.post('/submitanswer', getUserId, submitAnswer)
router.post('/viewanswers', isAuthorized, viewAnswers)
router.post('/viewprevans', isAuthorized, viewPrevAns)
router.post('/viewprevpolls', isAuthorized, viewPrevPolls)
router.post('/savedraftans', isAuthorized, saveDraftAns)
router.post('/viewdraftans', isAuthorized, viewDraftAns)

//admin routes
router.post('/admin/signin', admin.signin)
router.post('/admin/deletepoll', isAuthorized, checkAdmin, admin.deletePoll)
router.post('/admin/deleteanswer', isAuthorized, checkAdmin, admin.deleteAnswer)
router.post('/admin/deleteuser', isAuthorized, checkAdmin, admin.deleteUser)
router.post('/admin/modifyanswer', isAuthorized, checkAdmin, admin.modifyAnswer)
router.post('/admin/modifypoll', isAuthorized, checkAdmin, admin.modifyPoll)
router.post('/admin/modifyuser', isAuthorized, checkAdmin, admin.modifyUser)
router.post('/admin/viewpoll', isAuthorized, checkAdmin, admin.viewPoll)
router.post('/admin/viewuser', isAuthorized, checkAdmin, admin.viewUser)
router.post('/admin/viewanswers', isAuthorized, checkAdmin, admin.viewAnswers)
router.post('/admin/viewprevans', isAuthorized, checkAdmin, admin.viewPrevAns)
router.post('/admin/submitanswer', isAuthorized, checkAdmin, admin.submitAnswer)
router.post('/admin/getpolls', isAuthorized, checkAdmin, admin.getPolls)
router.post(
  '/admin/viewprevpolls',
  isAuthorized,
  checkAdmin,
  admin.viewPrevPolls
)
router.post('/admin/getusers', isAuthorized, checkAdmin, admin.getUsers)

router.get('/test', (req, res) => {
  res.status(400).send({ success: true, message: 'ok' })
})

module.exports = router
