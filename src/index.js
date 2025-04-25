import express from 'express';
import cors from 'cors';
import {StreamChat} from 'stream-chat';
import {v4 as uuidv4} from 'uuid'; 
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

const app=express();
const port=3000;
app.use(cors());
app.use(express.json());
const api_key=process.env.API_KEY;
const api_secret=process.env.API_SECRET;
const serverClient= StreamChat.getInstance(api_key,api_secret);

app.post('/signup',async (req,res)=>{ 
    const {username,email,password}=req.body;
    const userId=uuidv4();
    const hashedPassword=bcrypt.hashSync(password,10);
    try{
        const userToken=serverClient.createToken(userId);
       
        const userData={
            id:userId,
            name:username,
            email:email,
            hashedPassword:hashedPassword,
            image:`https://getstream.io/random_png/?id=${userId}&name=${username}`,
        }
        await serverClient.upsertUser(userData);
        res.status(200).json({userData,userToken});
    }catch(error){
        console.log(error);
        res.status(500).json({error:error.message});
    }
})

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const { users } = await serverClient.queryUsers({ name: username });

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];

        const isPasswordValid = bcrypt.compareSync(password, user.hashedPassword);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const token = serverClient.createToken(user.id);
        res.status(200).json({ user, token });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
}   );