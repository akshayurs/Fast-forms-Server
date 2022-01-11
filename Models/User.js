const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    trim: true,
    minLength: 3,
    maxLength: 30,
    lowercase: true,
    required: [true, 'Username is required'],
    unique: true,
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxLength: 30,
    minLength: 3,
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'Email is required'],
    match:
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    maxLength: 50,
    select: false,
  },
  createdDate: {
    type: Date,
    default: Date.now(),
  },
  passwordResetToken: {
    type: String,
  },
})

UserSchema.pre('save', function (next) {
  if (!this.isModified('password')) return next()
  this.password = bcrypt.hashSync(this.password, 10)
  next()
})
UserSchema.methods.validatePassword = function (password) {
  return bcrypt.compareSync(password, this.password)
}
module.exports = mongoose.model('User', UserSchema)
