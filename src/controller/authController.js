import { pool } from "../models/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const showLogin = (req,res) => {
    res.render('login', {error: null});
}

export const login = async (req, res) => {
    const { email, password } = req.body;
    try{
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        if(result.rows.length === 0){
            
            await pool.query(
                `INSERT INTO audit_logs (action, entity, description, ip_address) values ($1, $2, $3, $4)`,
                ['LOGIN_FAILED','auth','Kullanıcı Bulunamadı.', req.ip]
            );
            return res.render('login', {error: "Hatalı e-mail veya şifre."});
        }
        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
            await pool.query(
                `INSERT INTO audit_logs (user_id, action, entity, description, ip_address) values ($1,$2, $3, $4,$5)`,
                [user.id,'LOGIN_FAILED','auth','Hatalı Şifre Girişi', req.ip]
            )
            return res.render('login', {error: "Hatalı e-mail veya şifre."});
        }
        
        const token = jwt.sign(
            {userId: user.id},
            "d4a19f6c7e8b2a3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f",
            {expiresIn: '1h'}
        );
        
        await pool.query(
            `INSERT INTO audit_logs (user_id, action, entity, description, ip_address) values ($1,$2, $3, $4,$5)`,
            [user.id,'LOGIN_SUCCESS','auth','Kullanıcı sisteme giriş yaptı.', req.ip]
        )
        const permQuery = `
            SELECT p.name
            FROM user_roles ur
            JOIN role_permissions rp ON ur.role_id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE ur.user_id = $1
        `;
        const permResult = await pool.query(permQuery, [user.id]);
        const permissions = permResult.rows.map(p => p.name);
        
        req.session.user = {
        id: user.id,
        email: user.email,
        permissions: permissions
        };
        res.redirect(`/dashboard`);

    }catch(err){
        console.log(err);
        res.render('login', {error: "Bir hata oluştu. Lütfen tekrar deneyiniz."});
    }
}