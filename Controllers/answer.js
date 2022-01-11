const Poll = require('../Models/Poll')
const Answer = require('../Models/Answer')

// route to submit answer to poll
// req.body={
//     username*,
//     password*,
//     pollId,
//     ans : {}
// }
// sends -> {success,message}
exports.submitAnswer = async (req, res) => {
  try {
    const poll = await Poll.findById(req.body.pollId)
    // poll not found
    if (!poll) {
      return res.send({ success: false, message: 'incorrect Id' })
    }
    //checking if authentication is true then checking username and password in list
    if (
      poll.authReq == false ||
      (req.body.username &&
        req.body.password &&
        poll.auth.some(({ username, password }) => {
          return (
            req.body.username === username && req.body.password === password
          )
        }))
    ) {
      //checking for field lenth match
      if (
        req.body.ans.reqFieldsAns.length != poll.reqFieldsToAns.length ||
        req.body.ans.queFieldsAns.length != poll.questions.length
      ) {
        return res.send({
          success: false,
          message: 'answer fields not matching',
        })
      }
      //checking for previous submits
      if (poll.authReq) {
        const oldAnswer = await Answer.findOne({
          pollId: req.body.pollId,
          username: req.body.username,
          password: req.body.password,
        })
        if (oldAnswer) {
          return res.send({ success: false, message: 'already submitted' })
        }
      }

      const answer = await Answer.create({ ...req.body, ...req.body.ans })
      res.send({ success: true, answer })
    } else {
      return res.send({ success: false, message: 'authentication failed' })
    }
  } catch (err) {
    return res.send({ success: false, message: err.message })
  }
}
