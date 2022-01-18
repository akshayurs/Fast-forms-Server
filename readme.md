# Fast Forms Api

### API end points

#### Authentication Routes

- Signing up or register

```js
POST /signup

body = {
    name,
    username,
    email,
    password
 }

 returns -> {success, message, token}
```

- Sign in user and sending token

```js
POST /signin

body = {
  email,
  password,
}

returns -> {success, token, message}
```

- Sign out or log out and clear cookies

```js
GET /signout

returns -> {success, message}
```

- Check existing user

```js
GET /userexists

body = {
    username
}

returns -> { success, message, exists}
```

- change password

```js
POST /changepassword

body = {
    oldPassword,
    newPassword
}

returns -> {success, message}
```

- verify account

```js
GET /verify/:token

returns -> {success, message}
```

- generate reset password token

```js
POST /resetPasswordReq
```

-

```js
GET /resetpassword/:token
```

-

```js
POST /resetpassword
```

### User details :

```js
    username: {
        type: String,
        minLength: 3,
        maxLength: 30,
        lowercase: true,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
        maxLength: 30,
        minLength: 3,
    },
    email: {
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        maxLength: 50,
    },
    createdDate: {
        type: Date,
    },
    verified: {
        type: Boolean,
        default: true,
    },
    passwordResetToken: {
        type: String,
    }
```

### Poll details :

```js
    createdBy: {
    type: ObjectId,
    ref: 'User',
    required: true,
    },
    title: {
      type: String,

      minLength: 3,
      maxLength: 30,
      required: true,
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
            required: true,
          },
          title: {
            type: String,
            minLength: 3,
            maxLength: 30,
            required: true,
          },
          options: [
            {
              type: String,
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
            required: true,
          },
          title: {
            type: String,
            minLength: 3,
            maxLength: 30,
            required: true,
          },
          des: {
            type: String,
            maxLength: 100,
          },
          options: [
            {
              type: String,
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
```

### Answer details :
```js

    pollId: {
        type: ObjectId,
        ref: 'Poll',
        required: true,
    },
    submittedBy: {
        type: ObjectId,
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
    }
```
