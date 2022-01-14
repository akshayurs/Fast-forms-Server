const mongoose = require('mongoose')
const DraftAnswerSchema = new mongoose.Schema({
  pollId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poll',
    required: true,
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
})

module.exports = mongoose.model('DraftAnswer', DraftAnswerSchema)
