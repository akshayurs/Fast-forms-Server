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
      return res.send({ success: false, message: 'invalid credentials' })
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
      .send({ success: true, token })
  } catch (err) {
    return res.send({ success: false, message: err.message })
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
      return res.send({ success: false, message: 'active poll not found' })
    }
    oldPoll.deleted = true
    oldPoll.deletedTime = Date.now()
    await oldPoll.save()

    res.send({ success: true, message: 'deleted' })
  } catch (err) {
    res.send({ success: false, message: err.message })
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
      return res.send({ success: false, message: 'Incorrect id' })
    }

    await poll.populate('createdBy', { name: 1, username: 1, _id: 0 })
    res.send({ success: true, poll, owner: false })
  } catch (err) {
    res.send({ success: false, message: err.message })
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
      return res.send({ success: false, message: 'not found' })
    }

    res.send({ success: true, user })
  } catch (err) {
    res.send({ success: false, message: err.message })
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
      return res.send({ success: false, message: 'not found' })
    }

    res.send({ success: true, user, message: 'user deleted' })
  } catch (err) {
    res.send({ success: false, message: err.message })
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
      return res.send({ success: false, message: 'not found' })
    }

    res.send({ success: true, answer })
  } catch (err) {
    res.send({ success: false, message: err.message })
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
      return res.send({ success: false, message: 'Incorrect id' })
    }

    await poll.populate('createdBy', { name: 1, username: 1, _id: 0 })
    res.send({ success: true, poll, owner: false })
  } catch (err) {
    res.send({ success: false, message: err.message })
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
    const poll = await Poll.findById(pollId)
    // poll not found
    if (!poll) {
      return res.send({ success: false, message: 'incorrect Id' })
    }

    const answers = await Answer.find({ pollId })
      .sort({ createdTime: -1 })
      .skip((pageNumber - 1) * numberOfItems)
      .limit(numberOfItems)

    const count = await Answer.countDocuments({ pollId }).exec()

    let prevPage = true
    let nextPage = true

    if (pageNumber === 0) prevPage = false
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
    res.send({ success: true, poll: oldPoll })
  } catch (err) {
    res.send({ success: false, message: err.message })
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
      return res.send({ success: false, message: 'not found' })
    }

    Object.entries(modify).forEach((arr) => {
      oldPoll[arr[0]] = arr[1]
    })

    await user.save()

    res.send({ success: true, user })
  } catch (err) {
    res.send({ success: false, message: err.message })
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
      return res.send({ success: false, message: 'not found' })
    }

    Object.entries(req.body.modify).forEach((arr) => {
      oldPoll[arr[0]] = arr[1]
    })

    await answer.save()

    res.send({ success: true, answer })
  } catch (err) {
    res.send({ success: false, message: err.message })
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

    const users = await User.find()
      .sort({ createdDate: -1 })
      .skip((pageNumber - 1) * numberOfItems)
      .limit(numberOfItems)
    const count = await User.countDocuments({}).exec()
    let prevPage = true
    let nextPage = true
    if (pageNumber === 1) prevPage = false
    if (count <= pageNumber * numberOfItems) nextPage = false
    return res.send({
      success: true,
      users,
      prevPage,
      nextPage,
      count,
    })
  } catch (err) {
    res.send({ success: false, message: err.message })
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

    const polls = await Poll.find()
      .sort({ createdDate: -1 })
      .skip((pageNumber - 1) * numberOfItems)
      .limit(numberOfItems)
    const count = await Poll.countDocuments({}).exec()
    let prevPage = true
    let nextPage = true
    if (pageNumber === 1) prevPage = false
    if (count <= pageNumber * numberOfItems) nextPage = false
    return res.send({
      success: true,
      polls,
      prevPage,
      nextPage,
      count,
    })
  } catch (err) {
    res.send({ success: false, message: err.message })
  }
}
