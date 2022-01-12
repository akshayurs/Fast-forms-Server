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

// route to view answer
// creator of poll
// req.body ={
//   pollId,
//   pageNumber,
//   numberOfItems
// }
// sends -> { success,message ,poll, answers, count, prevPage, nextPage }
exports.viewAnswers = async (req, res) => {
  try {
    const { pollId, pageNumber, numberOfItems } = req.body
    const poll = await Poll.findById(pollId)
    // poll not found
    if (!poll) {
      return res.send({ success: false, message: 'incorrect Id' })
    }
    if (!poll.createdBy.equals(req.userId)) {
      return res.send({ success: false, message: 'Not authorized' })
    }
    const answers = await Answer.find({ pollId })
      .sort({ createdTime: -1 })
      .skip((pageNumber - 1) * numberOfItems)
      .limit(numberOfItems)
    const count = await Answer.countDocuments({ pollId }).exec()
    let prevPage = true
    let nextPage = true
    if (pageNumber === 1) prevPage = false
    if (count <= pageNumber * numberOfItems) nextPage = false
    return res.send({
      success: true,
      poll,
      answers,
      count,
      prevPage,
      nextPage,
    })
  } catch (err) {
    res.send({ success: false, message: err.message })
  }
}
