const Poll = require('../Models/Poll')
const User = require('../Models/User')
const Answer = require('../Models/Answer')
const mongodb = require('mongodb')
const jwt = require('jsonwebtoken')

// route to sign in
// body.req = {
//     username,
//     password
// }
// sends -> {success,message,token}
exports.signin = async (req, res) => {
  try {
    const { username, password } = req.body
    const user = await User.findOne({
      $or: [{ email: username }, { username }],
    }).select({
      password: 1,
      isAdmin: 1,
    })
    if (!user || !user.validatePassword(password) || !user._doc.isAdmin) {
      return res
        .status(401)
        .send({ success: false, status: 401, message: 'invalid credentials' })
    }

    const token = jwt.sign(
      { id: user['_id'], isAdmin: true },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXP,
      }
    )
    res
      .cookie('token', token, {
        expires: new Date(
          Date.now() + process.env.JWT_COOKIE_EXP * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
      })
      .status(200)
      .send({ success: true, status: 200, token })
  } catch (err) {
    return res
      .status(500)
      .send({ success: false, status: 500, message: err.message })
  }
}

//route to delete poll
//
// body.req={
//     pollId
// }
exports.deletePoll = async (req, res) => {
  try {
    let oldPoll = await Poll.findById(req.body.pollId)

    //poll not found or poll already deleted
    if (!oldPoll || oldPoll.deleted) {
      return res
        .status(404)
        .send({ success: false, status: 404, message: 'active poll not found' })
    }
    oldPoll.deleted = true
    oldPoll.deletedTime = Date.now()
    await oldPoll.save()

    res.status(200).send({ success: true, status: 200, message: 'deleted' })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

// route to view poll
//
// req.body = {
//   pollId,
// }
//
// sends -> { success,message,poll}
exports.viewPoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.body.pollId)

    //poll not found
    if (!poll) {
      return res
        .status(404)
        .send({ success: false, status: 404, message: 'Incorrect id' })
    }

    await poll.populate('createdBy', { name: 1, username: 1, _id: 0 })
    res.status(200).send({ success: true, status: 200, poll, owner: false })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

// route to view single user
// req.body = {
//     userId : //userId or username or email
// }
// sends -> {success,user,message}
exports.viewUser = async (req, res) => {
  const { userId } = req.body
  try {
    let objectId = null
    if (
      typeof userId == 'string' &&
      (userId.length == 24 || userId.length == 12)
    ) {
      objectId = mongodb.ObjectId(userId)
    }
    const user = await User.findOne({
      $or: [{ email: userId }, { username: userId }, { _id: objectId }],
    })

    //user not found
    if (!user) {
      return res
        .status(404)
        .send({ success: false, status: 404, message: 'not found' })
    }

    res.status(200).send({ success: true, status: 200, user })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

// route to delete single user
// req.body = {
//     userId : //userId or username or email
// }
// sends -> {success,user,message}
exports.deleteUser = async (req, res) => {
  const { userId } = req.body
  try {
    let objectId = null
    if (
      typeof userId == 'string' &&
      (userId.length == 24 || userId.length == 12)
    ) {
      objectId = mongodb.ObjectId(userId)
    }
    const user = await User.deleteOne({
      $or: [{ email: userId }, { username: userId }, { _id: objectId }],
    })

    //user not found
    if (!user) {
      return res
        .status(404)
        .send({ success: false, status: 404, message: 'not found' })
    }

    res
      .status(200)
      .send({ success: true, status: 200, user, message: 'user deleted' })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

// route to delete answer
// req.body = {
//     answerId
// }
// sends -> {success,answer,message}
exports.deleteAnswer = async (req, res) => {
  const { answerId } = req.body
  try {
    let answer = await User.findOneAndDelete(answerId)

    if (!answer) {
      return res
        .status(404)
        .send({ success: false, status: 404, message: 'not found' })
    }

    res.status(200).send({ success: true, status: 200, answer })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

//route to view single poll
// req.body = {
//   pollId,
//   username*,
//   password*
// }
//
// sends -> { success,message,poll}
exports.viewPoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.body.pollId)

    //poll not found
    if (!poll) {
      return res
        .status(404)
        .send({ success: false, status: 404, message: 'Incorrect id' })
    }

    await poll.populate('createdBy', { name: 1, username: 1, _id: 0 })
    res.status(200).send({ success: true, status: 200, poll, owner: false })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

// route to view all answers of single poll
// req.body ={
//   pollId,
//   pageNumber,
//   numberOfItems
// }
// sends -> { success,message ,poll, answers, count, prevPage, nextPage }
exports.viewAnswers = async (req, res) => {
  try {
    const { pollId, pageNumber, numberOfItems } = req.body
    pageNumber = pageNumber ?? 1
    numberOfItems = numberOfItems ?? 10
    const poll = await Poll.findById(pollId)
    // poll not found
    if (!poll) {
      return res
        .status(404)
        .send({ success: false, status: 404, message: 'incorrect Id' })
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

    if (pageNumber === 0) prevPage = false
    if (count <= pageNumber * numberOfItems) nextPage = false

    return res
      .status(200)
      .send({
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

// route to modify poll
//
// req.body = {
//   pollId
//   modify : { field1: value1, ....}
// }
//
// sends -> { success,message,poll}
exports.modifyPoll = async (req, res) => {
  try {
    let oldPoll = await Poll.findById(req.body.pollId)

    //modifying the fields of oldPoll
    Object.entries(req.body.modify).forEach((arr) => {
      oldPoll[arr[0]] = arr[1]
    })
    oldPoll.modifiedTime = Date.now()
    await oldPoll.save()
    res.status(200).send({ success: true, status: 200, poll: oldPoll })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

// route to modify user
//
// req.body = {
//   userId
//   modify : { field1: value1, ....}
// }
//
// sends -> { success,message}
exports.modifyUser = async (req, res) => {
  const { userId, modify } = req.body
  try {
    let objectId = null
    if (
      typeof userId == 'string' &&
      (userId.length == 24 || userId.length == 12)
    ) {
      objectId = mongodb.ObjectId(userId)
    }
    let user = await User.findOne({
      $or: [{ email: userId }, { username: userId }, { _id: objectId }],
    })

    if (!user) {
      return res
        .status(404)
        .send({ success: false, ststus: 404, message: 'Not found' })
    }

    Object.entries(modify).forEach((arr) => {
      oldPoll[arr[0]] = arr[1]
    })

    await user.save()

    res.status(200).send({ success: true, status: 200, user })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

// route to modify answer
//
// req.body = {
//   answerId
//   modify : { field1: value1, ....}
// }
//
// sends -> { success,message,answer}
exports.modifyAnswer = async (req, res) => {
  const { answerId } = req.body
  try {
    let answer = await User.findById(answerId)

    if (!answer) {
      return es
        .status(404)
        .send({ success: false, ststus: 404, message: 'Not found' })
    }

    Object.entries(req.body.modify).forEach((arr) => {
      oldPoll[arr[0]] = arr[1]
    })

    await answer.save()

    res.status(200).send({ success: true, status: 200, answer })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

// route to view users
// req.body ={
//   pageNumber,
//   numberOfItems
// }
// sends -> { success, message, users, prevPage, nextPage, count }
exports.getUsers = async (req, res) => {
  try {
    const { pageNumber, numberOfItems } = req.body
    pageNumber = pageNumber ?? 1
    numberOfItems = numberOfItems ?? 10
    const users = await User.find()
      .sort({ createdDate: -1 })
      .skip((pageNumber - 1) * numberOfItems)
      .limit(numberOfItems)
    const count = await User.countDocuments({}).exec()
    let prevPage = true
    let nextPage = true
    if (pageNumber === 1) prevPage = false
    if (count <= pageNumber * numberOfItems) nextPage = false
    return res
      .status(200)
      .send({ status: 200, success: true, users, prevPage, nextPage, count })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

// route to view polls
// req.body ={
//   pageNumber,
//   numberOfItems
// }
// sends -> { success, message, polls, prevPage, nextPage, count }
exports.getPolls = async (req, res) => {
  try {
    const { pageNumber, numberOfItems } = req.body
    pageNumber = pageNumber ?? 1
    numberOfItems = numberOfItems ?? 10
    const polls = await Poll.find()
      .sort({ createdDate: -1 })
      .skip((pageNumber - 1) * numberOfItems)
      .limit(numberOfItems)
    const count = await Poll.countDocuments({}).exec()
    let prevPage = true
    let nextPage = true
    if (pageNumber === 1) prevPage = false
    if (count <= pageNumber * numberOfItems) nextPage = false
    return res
      .status(200)
      .send({ status: 200, success: true, polls, prevPage, nextPage, count })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

//route to submit answer
// req.body = {
//   pollId,
//   ans = { }
// }
// sends -> {success,message,answer}
exports.submitAnswer = async (req, res) => {
  try {
    const poll = await Poll.findById(req.body.pollId)
    // poll not found
    if (!poll) {
      return res
        .status(404)
        .send({ success: false, status: 404, message: 'Incorrect id' })
    }
    const answer = await Answer.create({ ...req.body, ...req.body.ans })
    res.status(200).send({ success: true, status: 200, answer })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

// route to view previous answers of user
// creator of poll
// req.body ={
//   userId // id or username or email
//   pageNumber,
//   numberOfItems
// }
// sends -> { success,message ,poll, answers, count, prevPage, nextPage }
exports.viewPrevAns = async (req, res) => {
  try {
    const { pageNumber, numberOfItems, userId } = req.body
    pageNumber = pageNumber ?? 1
    numberOfItems = numberOfItems ?? 10
    if (mongodb.ObjectID.isValid(userId)) {
      req.userId = userId
    } else {
      const user = await User.findOne({
        $or: [{ email: userId }, { username: userId }, { _id: objectId }],
      })
      if (!user) {
        return res
          .status(404)
          .send({ success: false, status: 404, message: 'Invalid user id' })
      }
      res.userId = user._id
    }
    const answers = await Answer.find({
      submittedBy: mongodb.ObjectID(req.userId),
    })
      .sort({ createdTime: -1 })
      .skip((pageNumber - 1) * numberOfItems)
      .limit(numberOfItems)
    const count = await Answer.countDocuments({
      submittedBy: mongodb.ObjectID(req.userId),
    }).exec()
    let prevPage = true
    let nextPage = true
    if (pageNumber === 1) prevPage = false
    if (count <= pageNumber * numberOfItems) nextPage = false
    return res
      .status(200)
      .send({ status: 200, success: true, answers, count, prevPage, nextPage })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

// route to view previous polls of user
// creator of poll
// req.body ={
//   userId
//   pageNumber,
//   numberOfItems
// }
// sends -> { success,message ,polls, count, prevPage, nextPage }
exports.viewPrevPolls = async (req, res) => {
  try {
    const { pageNumber, numberOfItems, userId } = req.body
    pageNumber = pageNumber ?? 1
    numberOfItems = numberOfItems ?? 10
    if (mongodb.ObjectID.isValid(userId)) {
      req.userId = userId
    } else {
      const user = await User.findOne({
        $or: [{ email: userId }, { username: userId }, { _id: objectId }],
      })
      if (!user) {
        return res
          .status(404)
          .send({ success: false, status: 404, message: 'Invalid user id' })
      }
      res.userId = user._id
    }
    const polls = await Poll.find({ createdBy: mongodb.ObjectID(req.userId) })
      .sort({ createdTime: -1 })
      .skip((pageNumber - 1) * numberOfItems)
      .limit(numberOfItems)

    const count = await Poll.countDocuments({
      createdBy: mongodb.ObjectID(req.userId),
    }).exec()

    let prevPage = true
    let nextPage = true
    if (pageNumber === 1) prevPage = false
    if (count <= pageNumber * numberOfItems) nextPage = false
    return res
      .status(200)
      .send({ status: 200, success: true, polls, count, prevPage, nextPage })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}
