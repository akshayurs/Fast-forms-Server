const Poll = require('../Models/Poll')
const User = require('../Models/User')
const Answer = require('../Models/Answer')
const { sendMail, newPollTemplate } = require('../Helpers/email')
const mongodb = require('mongodb')
// route to create poll
// signed in users
// req.body = {
//   userId
// }
//
// returns -> { success, status, message}
exports.createPoll = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).send({
        success: false,
        status: 404,
        message: 'Invalid user id',
      })
    }

    if (req.body.emails?.length > 0) {
      req.body.emails = [...new Set(req.body.emails)]
    }
    const newPoll = await Poll.create({ ...req.body, createdBy: req.userId })
    res.status(200).send({ success: true, status: 200, newPoll })
    if (newPoll.sendEmails && newPoll.authReq && newPoll.auth.length > 0) {
      sendMail(
        newPoll.emails,
        newPoll.title,
        newPollTemplate(
          `${process.env.SITE_URL}/view/${newPoll._id}`,

          newPoll.title,
          user.name,
          poll.startTime,
          poll.endTime
        )
      )
    }
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

// route to modify poll
// signed in users
// req.body = {
//   pollId
//   modify : { field1: value1, ....}
// }
//
// returns -> { success,status,message}
exports.modifyPoll = async (req, res) => {
  try {
    let poll = await Poll.findById(req.body.pollId)

    //if poll deleted or not editable question or user is not the creator
    if (
      !req.body.modify ||
      !poll ||
      poll.deleted ||
      !poll.createdBy.equals(req.userId) ||
      poll.queEditable != true
    ) {
      return res
        .status(401)
        .send({ success: false, status: 401, message: 'Not authorized' })
    }
    const user = await User.findById(req.userId)
    if (!user) {
      return res
        .status(404)
        .send({ success: true, status: 404, message: 'Invalid user id' })
    }

    let oldEmails = poll.emails ?? []
    let emailsModified = false
    if (req.body.modify.emails) {
      emailsModified = true
    }

    //modifying the fields of poll
    Object.entries(req.body.modify).forEach((arr) => {
      poll[arr[0]] = arr[1]
    })
    poll.modifiedTime = Date.now()
    await poll.save()
    res.status(200).send({ success: true, status: 200, poll })

    if (emailsModified && poll.sendEmails && poll.emails) {
      const newEmails = poll.emails.filter((email) => {
        if (!oldEmails.includes(email)) {
          return true
        }
        return false
      })
      sendMail(
        newEmails,
        poll.title,
        newPollTemplate(
          `${process.env.SITE_URL}/view/${poll._id}`,

          poll.title,
          user.name,
          poll.startTime,
          poll.endTime
        )
      )
    }
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

// route to view poll
//
// req.params = {
//   pollId,
// }
//
// returns -> { success,status,message,poll}
exports.viewPoll = async (req, res) => {
  const { pollId } = req.params
  try {
    const poll = await Poll.findById(pollId)
      .select('-_id -__v')
      .populate('createdBy', { name: 1, username: 1 })

    //poll not found or poll deleted
    if (!poll || poll.deleted) {
      return res
        .status(404)
        .send({ success: false, status: 404, message: 'Incorrect id' })
    }

    // if user is creator of poll
    if (poll.createdBy.equals(req.userId)) {
      return res
        .status(200)
        .send({ success: true, status: 200, poll, owner: true })
    }

    await poll.populate('createdBy', { name: 1, username: 1, _id: 0 })
    let startTime = new Date(poll.startTime)
    let endTime = new Date(poll.endTime)
    let now = new Date()
    poll.questions.forEach((q) => {
      q.answer = null
    })

    // checking for live poll
    if (now > startTime) {
      let user = null
      if (poll.authReq == true) {
        user = await User.findById(req.userId)
        //checking if authentication is true and checking username and password in list
        if (!req.userId || !user || !poll.emails.includes(user.email)) {
          return res.status(401).send({
            success: false,
            status: 401,
            poll: {
              title: poll.title,
              des: poll.des,
              createdBy: poll.createdBy,
              startTime: poll.startTime,
              endTime: poll.endTime,
            },
            pollStarted: false,
            message: 'authentication failed',
          })
        }
      }
      poll.auth = null
      res.status(200).send({
        success: true,
        status: 200,
        poll,
        pollStarted: true,
        owner: false,
      })
    } else
      res.status(200).send({
        status: 200,
        success: true,
        poll: {
          title: poll.title,
          des: poll.des,
          createdBy: poll.createdBy,
          startTime: poll.startTime,
          endTime: poll.endTime,
        },
        pollStarted: false,
        owner: false,
        message: 'check the timings',
      })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

// route to delete poll
// signed in users
// req.params = {
//   pollId
// }
//
// returns -> { success,status,message}
exports.deletePoll = async (req, res) => {
  const { pollId } = req.params
  try {
    let oldPoll = await Poll.findById(pollId)
    //poll not found
    if (!oldPoll || oldPoll.deleted) {
      return res
        .status(404)
        .send({ success: false, status: 404, message: 'Not Found' })
    }
    //poll not found or poll already deleted or poll is not by user
    if (!oldPoll.createdBy.equals(req.userId)) {
      return res
        .status(401)
        .send({ success: false, status: 401, message: 'Not authorized' })
    }

    oldPoll.deleted = true
    oldPoll.deletedTime = Date.now()
    await oldPoll.save()

    res.status(200).send({ success: true, status: 200, message: 'deleted' })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

// route to view previous polls of user
// req.query ={
//   pageNumber,
//   numberOfItems
// }
// returns -> { success,message ,polls, count, prevPage, nextPage }
exports.viewPrevPolls = async (req, res) => {
  try {
    let { pageNumber, numberOfItems } = req.query
    pageNumber = pageNumber ?? 1
    numberOfItems = numberOfItems ?? 10
    const polls = await Poll.find({
      createdBy: mongodb.ObjectID(req.userId),
      deleted: false,
    })
      .select({ title: 1, des: 1, startTime: 1, endTime: 1, queEditable: 1 })
      .sort({ createdTime: -1 })
      .skip((pageNumber - 1) * numberOfItems)
      .limit(numberOfItems)

    const count = await Poll.countDocuments({
      createdBy: mongodb.ObjectID(req.userId),
      deleted: false,
    }).exec()

    let prevPage = true
    let nextPage = true
    if (pageNumber == 1) prevPage = false
    if (count <= pageNumber * numberOfItems) nextPage = false
    return res
      .status(200)
      .send({ status: 200, success: true, polls, count, prevPage, nextPage })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

// route to view public polls
// req.query ={
//   pageNumber,
//   numberOfItems
// }
// returns -> { success,message ,polls, count, prevPage, nextPage }
exports.publicPolls = async (req, res) => {
  try {
    let { pageNumber, numberOfItems } = req.query
    pageNumber = pageNumber ?? 1
    numberOfItems = numberOfItems ?? 10
    const polls = await Poll.find({ publicPoll: true, deleted: false })
      .select({
        title: 1,
        des: 1,
        createdBy: 1,
        startTime: 1,
        endTime: 1,
        showStats: 1,
      })
      .sort({ createdTime: -1 })
      .skip((pageNumber - 1) * numberOfItems)
      .limit(numberOfItems)
      .populate('createdBy', { name: 1, username: 1, _id: 0 })

    const count = await Poll.countDocuments({
      createdBy: mongodb.ObjectID(req.userId),
      deleted: false,
    }).exec()
    let prevPage = true
    let nextPage = true
    if (pageNumber == 1) {
      prevPage = false
    }

    if (count <= pageNumber * numberOfItems) nextPage = false

    return res.status(200).send({
      status: 200,
      success: true,
      polls,
      count,
      prevPage,
      nextPage,
    })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}

// route to view public polls
// req.params = {
//   text
//}
// returns -> { success,message ,polls }
exports.searchPublicPoll = async (req, res) => {
  try {
    const { text } = req.params
    const polls = await Poll.find({
      publicPoll: true,
      deleted: false,
      title: { $regex: new RegExp(text, 'ig') },
    })
      .select({
        title: 1,
        des: 1,
        createdBy: 1,
        startTime: 1,
        endTime: 1,
      })
      .limit(10)
      .populate('createdBy', { name: 1, username: 1, _id: 0 })

    return res.status(200).send({
      status: 200,
      success: true,
      polls,
    })
  } catch (err) {
    res.status(500).send({ success: false, status: 500, message: err.message })
  }
}
