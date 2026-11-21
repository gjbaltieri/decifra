import express from 'express'
import { db } from './database'

const app = express()


app.get('', async (req, res) => {
    try {
        const result = db.query('SELECT NOW()')
        res.json({
            connected: true,
            timestamp: (await result).rows[0].now
        });
    }
    catch (error) {

        console.error(error)

    }
})


app.listen(3000, () => {
    console.log('Server running in http://localhost:3000/')
})