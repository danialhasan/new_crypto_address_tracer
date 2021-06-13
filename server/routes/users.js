// mongodb setup
const mongoose = require('mongoose')
const mongodbPassword = process.env.MONGODB_PASSWORD
const userSchema = require('../schema/userSchema.js')
const User = mongoose.model("user", userSchema, "Users")

// jwt setup
const jwt = require("jsonwebtoken")

// express setup
const express = require('express');
const router = express.Router();

// bcrypt setup 
const bcrypt = require('bcrypt');

// connecting to MongoDB with Mongoose
const connectionString = `mongodb+srv://dbAdmin:${process.env.MONGODB_PASSWORD}@cluster0.wcdjk.mongodb.net/UnsplashClone?retryWrites=true&w=majority`;
try {
    mongoose.connect(connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
} catch {
    console.log("MongoDB Auth failed")
}

async function findUser(email) {
    /**
     * findOne resolves to the document (if it exists), or null (if the document does not exist)
     */
    return await User.findOne({
        email
    })
}

router.get('/', (req, res) => {
    res.send("You hit the /users route.")
});

async function emptyCollections() {
    let deleted = await User.deleteMany({})
    if (deleted) {
        console.log("All documents in collection deleted.")
    } else {
        console.log("There was an error in the deletion of documents.")
    }
}

router.route('/login')
    .get((req, res) => {
        res.send("This is the login GET route")
    })
    .post((req, res) => {
        console.log(req)
        res.send("This is the login POST route")
    })
router.post('/login/verify', async (req, res) => {
    /**
     * Since we're using JWT for auth, we create a new JWT for the user once they log in. 
     * Every time they access a resource using their account, we check the request header
     * to make sure their JWT matches our records by decoding it with our access token secret.
     */
    // emptyCollections()
    console.log(req.body.email)
    console.log(req.body.password)
    // createUser(req.body.username, req.body.password)

    let userObject = await findUser(req.body.email)

    if (userObject != null) {
        // res.write("User was found in profiles database")
        console.log("User found \n\n")

        console.log(`Users plaintext password: ${req.body.password}`)
        console.log(`Users hashed password: ${userObject.hashedPassword}`)

        // see if incoming plaintext password == hashedPassword in database
        const passwordsMatch = await bcrypt.compare(req.body.password, userObject.hashedPassword)
        if (passwordsMatch) {
            // NOTE log user in with JWT
            // generating JWT
            const accessToken = jwt.sign(JSON.stringify(userObject), process.env.ACCESS_TOKEN_SECRET);
            res.status(214);
            res.statusMessage = "JWT Generated"
            res.send(JSON.stringify(accessToken))


        } else {
            res.status(215);
            res.statusMessage = "Incorrect password"
            res.send("Incorrect password. Requested password did not match database password.")
        }
    } else {
        res.send("User was not found in profiles database.");
        console.log("User not found \n\n")

    }
})
router.post('/register', async (req, res) => {
    let passwordsMatch = await checkPasswords(req.body.password, req.body.verifyPassword);
    let usernameIsAvailable = await usernameAvailable(req.body.username)
    let emailIsUnique = await emailUnique(req.body.email);
    let hashedPassword = await hashPassword(req.body.password)

    if (passwordsMatch && usernameIsAvailable && emailIsUnique && hashedPassword != undefined) {
        let newUser = await createAccount(req.body.username, req.body.name, req.body.email, hashedPassword);
        console.log('User saved to database')
        res.status(210).write("Account successfully created!")
    } else {
        console.log('User not saved to database')
        if (!passwordsMatch) {
            res.status(211).write("Passwords did not match.")
        } else if (!usernameIsAvailable) {
            res.status(212).write("Username was not available. ")
        } else if (!emailIsUnique) {
            res.status(213).write("The email used for registration is already registered to an account. If this is you, please log in with your password.")
        }
    }
    res.end()
})

async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1] //set token to authHeader.split(' ')[1] only if authHeader != null
    if (token == null) return res.sendStatus(401)

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, userObject) => {
        if (err) res.sendStatus(403);
        req.user = userObject;
        next()
    })
}

function checkPasswords(p1, p2) {
    let regex = /^[A-Za-z0-9 ]+$/;

    if (!(p1 == p2)) {
        res.send(`Passwords do not match: ${p1} != ${p2}`);
        return;
    } else if (p1.length < 8 || !regex.test(p1)) {
        res.send(`Password ${p1} does not meet the complexity requirements.`)
        return;
    } else {
        return true
    }
}

async function usernameAvailable(username) {
    try {
        let usernameIsUnique = await User.exists({
            username
        })
        return !usernameIsUnique
    } catch (error) {
        throw new Error(`Unable to connect to the database.`)
    }
}

async function emailUnique(email) {
    // checks database to see if email has been registered before.
    try {
        let emailIsUnique = await User.exists({
            email
        })
        return !emailIsUnique
    } catch (error) {
        throw new Error(`Unable to connect to the database.`)
    }
    // console.log(`emailIsAvailable (from the function itself): ${emailIsUnique}`)
    // return emailIsUnique; //sync, undefined
}

async function hashPassword(plainPassword) {
    const saltRounds = 10;
    return await bcrypt.hash(plainPassword, 10);
    // bcrypt.hash(plainPassword, saltRounds, function (err, hash) {
    //     if (err) throw err;
    //     // Store hash in your password DB.
    //     console.log(hash)

    //     return hash;
    // });

}

async function createAccount(username, name, email, hashedPassword) {
    let newUser = await new User({
        username,
        email,
        name,
        hashedPassword,
    }).save();
    return newUser
}


module.exports = router;