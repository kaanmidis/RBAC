import express from 'express';
import dotenv from 'dotenv';
import session from 'express-session';
import authRoutes from './routes/authRoutes.js';
import errorRoutes from './routes/errorRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import userRoutes from './routes/userRoutes.js';

dotenv.config();

const app = express();

app.set('view engine', 'ejs');
app.set('views', './src/views');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: "d4a19f6c7e8b2a3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: false
    }
}));

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

const PORT = process.env.PORT || 3000;

app.use('/', authRoutes);
app.use('/', errorRoutes);
app.use('/', auditRoutes);
app.use('/user', userRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

