const express = require('express')

const app = express()

const {open} = require('sqlite')

const sqlite3 = require('sqlite3')

const bcrypt = require('bcrypt')

const path = require('path')

const dbPath = path.join(__dirname, 'userData.db')

app.use(express.json())

let database

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Running Successfully...')
    })
  } catch (error) {
    console.log(`DB Error:${error.message}`)
    process.exit(1)
  }
}
initializeDbAndServer()

//API 1
app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body

  const hashedPassword = await bcrypt.hash(password, 10)

  const selectQuery = `
       SELECT * 
       FROM user
       WHERE 
       username='${username}';
    
    `
  const dbUser = await database.get(selectQuery)

  if (dbUser !== undefined) {
    response.status(400)
    response.send('User already exists')
  } else {
    // check password length and create new user query
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const createUserQuery = `
        INSERT INTO 
             user (username,name,password,gender,location) 
        VALUES ('${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}');
        `
      const newUser = await database.run(createUserQuery)
      response.send('User created successfully')
    }
  }
})

// API 2

app.post('/login', async (request, response) => {
  const {username, password} = request.body

  const selectQuery = `
       SELECT * 
       FROM user
       WHERE 
       username='${username}';
    
    `
  const dbUser = await database.get(selectQuery)

  if (dbUser !== undefined) {
    const isPassWordIsMathed = await bcrypt.compare(password, dbUser.password)
    if (isPassWordIsMathed === true) {
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  } else {
    response.status(400)
    response.send('Invalid user')
  }
})

//API 3
app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const hashedPassword = await bcrypt.hash(newPassword, 10)

  const selectedQuery = `
   SELECT * 
   FROM 
   user 
   WHERE 
   username='${username}'
  `
  const user = await database.get(selectedQuery)

  if (user !== undefined) {
    const isPassWordIsMathed = await bcrypt.compare(oldPassword, user.password)
    if (isPassWordIsMathed === false) {
      response.status(400)
      response.send('Invalid current password')
    } else {
      if (newPassword.length < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const updateQuery = `
        UPDATE user SET password='${hashedPassword}';
        `
        await database.run(updateQuery)
        response.send('Password updated')
      }
    }
  }
})

module.exports = app
