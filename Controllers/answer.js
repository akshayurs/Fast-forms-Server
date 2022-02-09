const Poll = require('../Models/Poll')
const User = require('../Models/User')
const Answer = require('../Models/Answer')
const DraftAnswer = require('../Models/DraftAnswer')
const mongodb = require('mongodb')
// route to submit answer to poll
// req.body={
//     pollId,
//     ans : {}
// }
// returns -> {success,status,message}
exports.submitAnswer = async (req, res) => {
  try {
    const poll = await Poll.findById(req.body.pollId)
    // poll not found
    if (!poll) {
      return res
        .status(404)
        .send({ success: false, status: 404, message: 'Incorrect id' })
    }
    //checking if authentication is true then checking username and password in list

    let user = null
    user = await User.findById(req.userId)
    if (poll.authReq == true) {
      if (!user || !poll.emails.includes(user.email)) {
        return res.status(401).send({
          success: false,
          status: 401,
          message: 'authentication failed',
        })
      }
    }

    //checking for field lenth match
    if (
      req.body.ans.reqFieldsAns.length != poll.reqFieldsToAns.length ||
      req.body.ans.queFieldsAns.length != poll.questions.length
    ) {
      return res.status(200).send({
        status: 200,
        success: false,
        message: 'answer fields not matching',
      })
    }
    //checking for previous submits
    if (req.userId) {
      const oldAnswer = await Answer.findOne({
        pollId: mongodb.ObjectID(req.body.pollId),
        submittedBy: mongodb.ObjectID(req.userId),
      })
      if (oldAnswer) {
        if (!poll.ansEditable) {
          return res
            .status(400)
            .send({ success: false, status: 400, message: 'already submitted' })
        }
        oldAnswer.reqFieldsAns = req.body.ans.reqFieldsAns
        oldAnswer.queFieldsAns = req.body.ans.queFieldsAns
        await oldAnswer.save()
        return res
          .status(200)
          .send({ success: true, status: 200, message: 'Answer Modified' })
      }
    }

    poll.answersCount = poll.answersCount + 1
    await poll.save()
    let answer
    if (req.userId) {
      answer = await Answer.create({
        ...req.body,
        ...req.body.ans,
        submittedBy: req.userId,
        email: user.email,
      })
    } else {
      answer = await Answer.create({
        ...req.body,
        ...req.body.ans,
      })
    }
    await DraftAnswer.findOneAndDelete({
      pollId: mongodb.ObjectID(req.body.pollId),
      submittedBy: mongodb.ObjectID(req.userId),
    })
    return res
      .status(200)
      .send({ success: true, status: 200, answer, message: 'Answer Submitted' })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

// route to view draft answer
// signed in users
//
// req.params = {
//   pollId
// }
// returns -> {success,status,message,answer}
exports.viewAns = async (req, res) => {
  const { pollId } = req.params
  try {
    let answer = await Answer.findOne({
      pollId: mongodb.ObjectID(pollId),
      submittedBy: mongodb.ObjectID(req.userId),
    })

    if (!answer) {
      return res.status(404).send({ success: false, status: 404 })
    }
    return res.status(200).send({ success: true, status: 200, answer })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

// route to view answer
// creator of poll
// req.params ={
//   pollId
//  }
// req.query ={
//   pageNumber,
//   numberOfItems
// }
// returns -> { success,message ,poll, answers, count, prevPage, nextPage }
exports.viewAnswers = async (req, res) => {
  try {
    const { pollId } = req.params
    const { pageNumber, numberOfItems } = req.query
    pageNumber = pageNumber ?? 1
    numberOfItems = numberOfItems ?? 10
    const poll = await Poll.findById(pollId)
    // poll not found
    if (!poll) {
      return res
        .status(404)
        .send({ success: false, status: 404, message: 'Incorrect id' })
    }
    if (!poll.createdBy.equals(req.userId)) {
      return res
        .status(401)
        .send({ success: false, status: 401, message: 'Not authorized' })
    }
    const answers = await Answer.find({ pollId: mongodb.ObjectID(pollId) })
      .sort({ createdTime: -1 })
      .skip((pageNumber - 1) * numberOfItems)
      .limit(numberOfItems)
    const count = await Answer.countDocuments({
      pollId: mongodb.ObjectID(pollId),
    }).exec()
    let prevPage = true
    let nextPage = true
    if (pageNumber == 1) prevPage = false
    if (count <= pageNumber * numberOfItems) nextPage = false
    return res.status(200).send({
      status: 200,
      success: true,
      poll,
      answers,
      count,
      prevPage,
      nextPage,
    })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

// route to view previous answers of user
// creator of poll
// req.query ={
//   pageNumber,
//   numberOfItems
// }
// returns -> { success,message ,poll, answers, count, prevPage, nextPage }
exports.viewPrevAns = async (req, res) => {
  try {
    let { pageNumber, numberOfItems } = req.query
    pageNumber = pageNumber ?? 1
    numberOfItems = numberOfItems ?? 10
    const answers = await Answer.find({
      submittedBy: mongodb.ObjectID(req.userId),
    })
      .sort({ createdTime: -1 })
      .skip((pageNumber - 1) * numberOfItems)
      .limit(numberOfItems)
      .populate('pollId', {
        createdBy: 1,
        title: 1,
        des: 1,
        ansEditable: 1,
        showStats: 1,
      })

    const count = await Answer.countDocuments({
      submittedBy: mongodb.ObjectID(req.userId),
    }).exec()
    let prevPage = true
    let nextPage = true
    if (pageNumber == 1) prevPage = false
    if (count <= pageNumber * numberOfItems) nextPage = false
    return res
      .status(200)
      .send({ status: 200, success: true, answers, count, prevPage, nextPage })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

// route to submit answer to poll
// req.params={
//     answerId,
//     ans : {}
// }
// returns -> {success,status,message}
exports.deleteAnswer = async (req, res) => {
  try {
    const { answerId } = req.params
    const answer = await Answer.findById(answerId)
    // poll not found
    if (!answer) {
      return res
        .status(404)
        .send({ success: false, status: 404, message: 'Incorrect id' })
    }
    const poll = await Poll.findById(answer.pollId)

    if (!poll.ansEditable || !answer.submittedBy.equals(req.userId)) {
      return res
        .status(401)
        .send({ success: false, status: 401, message: 'Not Authorized' })
    }
    poll.answersCount = poll.answersCount - 1
    poll.save()
    await Answer.findByIdAndDelete(answerId)
    return res
      .status(200)
      .send({ success: true, status: 200, answer, message: 'Answer Deleted' })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

// route to save draft answer
// signed in users
//
// req.body = {
//   pollId,
//   ans: {},
// }
// returns -> {success,status,message}
exports.saveDraftAns = async (req, res) => {
  try {
    if (req.userId) {
      return res
        .status(401)
        .send({ success: false, status: 401, message: 'Signin to access' })
    }

    const options = {
      new: true,
      upsert: true,
    }
    await DraftAnswer.findOneAndUpdate(
      {
        pollId: mongodb.ObjectID(pollId),
        submittedBy: mongodb.ObjectID(req.userId),
      },
      {
        ...req.body,
        ...req.body.ans,
        submittedBy: req.userId,
      },
      options
    )

    return res
      .status(200)
      .send({ success: true, status: 200, message: 'saved' })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

// route to view draft answer
// signed in users
//
// req.params = {
//   pollId
// }
// returns -> {success,status,message,answer}
exports.viewDraftAns = async (req, res) => {
  const { pollId } = req.params
  try {
    if (req.userId) {
      return res
        .status(401)
        .send({ success: false, status: 401, message: 'Signin to access' })
    }
    let answer = await DraftAnswer.findOne({
      pollId: mongodb.ObjectID(pollId),
      submittedBy: mongodb.ObjectID(req.userId),
    })

    return res.status(200).send({ success: true, status: 200, answer })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

//route to get statistics of answer
// req.params = {
// pollId
//}
exports.getStats = async (req, res) => {
  try {
    const { pollId } = req.params
    const poll = await Poll.findById(pollId)
    if (!poll) {
      res
        .status(404)
        .send({ success: false, status: 404, message: 'Poll not found' })
    }
    if (!(poll.createdBy.equals(req.userId) || poll.showStats)) {
      return res
        .status(401)
        .send({ success: false, status: 401, message: 'Not authorized' })
    }
    const answers = await Answer.find(
      {
        pollId: mongodb.ObjectId(pollId),
      },
      poll.createdBy.equals(req.userId) ? '' : '-submittedBy -reqFieldsAns'
    )

    res.status(200).send({
      success: true,
      status: 200,
      answers,
      poll,
      owner: poll.createdBy.equals(req.userId),
    })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}
