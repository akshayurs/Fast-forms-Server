const mongoose = require('mongoose')
const pollSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    trim: true,
    minLength: 3,
    maxLength: 30,
    required: [true, 'Title is required for Poll'],
  },
  authReq: {
    type: Boolean,
    default: false,
  },
  sendEmails: {
    type: Boolean,
    default: true,
  },
  auth: {
    type: [
      {
        email: {
          type: String,
          trim: true,
          minLength: 3,
          maxLength: 25,
          required: true,
        },
      },
    ],
    maxItems: 500,
  },
  reqFieldsToAns: {
    type: [
      {
        id: {
          required: true,
          type: Number,
        },
        fieldType: {
          type: String,
          enum: ['string', 'number', 'radio', 'checkbox', 'dropdown'],
          required: [true, 'Select question type'],
        },
        title: {
          type: String,
          trim: true,
          minLength: 3,
          maxLength: 30,
          required: [true, 'Title is required for required field to vote'],
        },
        options: [
          {
            type: String,
            trim: true,
            minLength: 1,
            maxLength: 50,
          },
        ],
      },
    ],
    maxItems: 10,
    required: true,
  },
  questions: {
    type: [
      {
        id: {
          required: true,
          type: Number,
        },
        fieldType: {
          type: String,
          enum: ['string', 'number', 'radio', 'checkbox', 'dropdown'],
          required: [true, 'Select question type'],
        },
        title: {
          type: String,
          trim: true,
          minLength: 3,
          maxLength: 30,
          required: [true, 'Title is required for question'],
        },
        des: {
          type: String,
          trim: true,
          maxLength: 100,
        },
        options: [
          {
            type: String,
            trim: true,
            minLength: 1,
            maxLength: 50,
          },
        ],
        answer: {
          type: Number,
          min: 0,
        },
      },
    ],
    maxItems: 100,
    minItems: 1,
    required: true,
  },
  createdTime: {
    type: Date,
    default: Date.now(),
  },
  modifiedTime: {
    type: Date,
  },
  startTime: {
    type: Date,
    default: Date.now(),
  },
  endTime: {
    type: Date,
    default: 99999999999999,
  },
  deletedTime: {
    type: Date,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
  queEditable: {
    type: Boolean,
    default: false,
  },
  ansEditable: {
    type: Boolean,
    default: false,
  },
  viewAns: {
    type: Boolean,
    default: false,
  },
  askFeedback: {
    type: Boolean,
    default: false,
  },
})

module.exports = mongoose.model('Poll', pollSchema)
