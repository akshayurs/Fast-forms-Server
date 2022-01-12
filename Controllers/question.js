const Poll = require('../Models/Poll')

exports.createPoll = async (req, res) => {
  try {
    const newPoll = await Poll.create({ createdBy: req.userId, ...req.body })
    res.send({ success: true, newPoll })
  } catch (err) {
    res.send({ success: false, message: err.message })
  }
}

// route to modify poll
// signed in users
// req.body = {
//   pollId
//   modify : { field1: value1, ....}
// }
//
// sends -> { success,message}
exports.modifyPoll = async (req, res) => {
  try {
    let oldPoll = await Poll.findById(req.body.pollId)

    //if poll deleted or not editable question or user is not the creator
    if (
      !req.body.modify ||
      !oldPoll ||
      oldPoll.deleted ||
      !oldPoll.createdBy.equals(req.userId) ||
      oldPoll.queEditable != true
    ) {
      return res.send({ success: false, message: 'Not authorized' })
    }

    //modifying the fields of oldPoll
    Object.entries(req.body.modify).forEach((arr) => {
      oldPoll[arr[0]] = arr[1]
    })
    oldPoll.modifiedTime = Date.now()
    await oldPoll.save()
    res.send({ success: true, oldPoll })
  } catch (err) {
    res.send({ success: false, message: err.message })
  }
}

// route to view poll
//
// req.body = {
//   pollId,
//   username*,
//   password*
// }
//
// sends -> { success,message,poll}
exports.viewPoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.body.pollId).select('-_id -__v')

    //poll not found or poll deleted
    if (!poll || poll.deleted) {
      return res.send({ success: false, message: 'Incorrect id' })
    }

    // if user is creator of poll
    if (poll.createdBy.equals(req.userId)) {
      return res.send({ success: true, poll, owner: true })
    }

    await poll.populate('createdBy', { name: 1, username: 1, _id: 0 })
    let startTime = new Date(poll.startTime)
    let endTime = new Date(poll.endTime)
    let now = new Date()
    poll.questions.forEach((q) => {
      q.answer = null
    })

    // checking for live poll
    if (now > startTime && now < endTime) {
      //checking if authentication is true and checking username and password in list
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
        poll.auth = null
        res.send({ success: true, poll, owner: false })
      } else {
        res.send({ success: false, message: 'authentication required' })
      }
    } else
      res.send({
        success: true,
        time: {
          startTime,
          endTime,
        },
        owner: false,
        message: 'check the timings',
      })
  } catch (err) {
    res.send({ success: false, message: err.message })
  }
}

// route to modify poll
// signed in users
// req.body = {
//   pollId
//   modify : { field1: value1, ....}
// }
//
// sends -> { success,message}
exports.deletePoll = async (req, res) => {
  try {
    let oldPoll = await Poll.findById(req.body.pollId)

    //poll not found or poll already deleted or poll is not by user
    if (!oldPoll || oldPoll.deleted || oldPoll.createdBy.equals(req.userId)) {
      return res.send({ success: false, message: 'Not authorized' })
    }

    oldPoll.deleted = true
    oldPoll.deletedTime = Date.now()
    await oldPoll.save()

    res.send({ success: true, message: 'deleted' })
  } catch (err) {
    res.send({ success: false, message: err.message })
  }
}
