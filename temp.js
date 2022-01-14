require('dotenv').config()
const { sendMail } = require('./Helpers/email')
async function abc() {
  try {
    let a = await sendMail(
      'conossdfasf4275@rea_asunz.com',
      'hello',
      'from akshay'
    )
    console.log(a)
  } catch (err) {
    console.log(err.message)
    console.log('\n\n\n')
    console.log(err)
  }
}
abc()
