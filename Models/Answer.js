const mongoose = require('mongoose')
const AnswerSchema = new mongoose.Schema({
  pollId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poll',
    required: true,
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  email: {
    type: String,
  },
  reqFieldsAns: {
    type: [
      {
        id: {
          type: Number,
          required: true,
        },
        ans: {
          type: String,
          required: true,
        },
      },
    ],
    maxItems: 100,
  },
  queFieldsAns: {
    type: [
      {
        id: {
          type: Number,
          required: true,
        },
        ans: {
          type: String,
          required: true,
        },
      },
    ],
    maxItems: 100,
  },
  feedback: {
    type: String,
    maxLength: 500,
  },
  createdTime: {
    type: Date,
    default: Date.now(),
  },
  modifiedTime: {
    type: Date,
  },
})

module.exports = mongoose.model('Answer', AnswerSchema)
