import {pool} from '../models/db.js';

export const unauthorized = (req, res) => {
    if (req.headers.accept?.includes('application/json')) {
        return res.status(403).json({ message: "Forbidden" });
    }
    res.status(403).render('unauthorized');
};

export const checkPermission = (permissionName) => {
    return async (req,res,next) => {
        try {
            const userId = req.session.user?.id;

            if (!userId) {
                if (req.headers.accept?.includes('application/json')) {
                    return res.status(401).json({ message: "Unauthorized" });
                }
                return res.redirect('/login');
            }
            const query = `
                SELECT p.name
                FROM user_roles ur
                JOIN role_permissions rp ON ur.role_id = rp.role_id
                JOIN permissions p ON rp.permission_id = p.id
                WHERE ur.user_id = $1
            `;
            const result = await pool.query(query, [userId]);
            const permission = result.rows.map(p => p.name);

            if(!permission.includes(permissionName)) {
                await pool.query(
                    `INSERT INTO audit_logs(user_id,action,entity,description,ip_address) values ($1,$2,$3,$4,$5)`,
                    [userId,'UNAUTHORIZED_ACCESS',permissionName,'Yetkisiz Erişim Denemesi', req.ip]
                )
                return res.redirect('/unauthorized');
            }
            next();
        } catch (error) {
            console.log(error);
            res.status(500).send('Yetkisiz Erişim Kontrolü Sırasında Sunucu Hatası');
        }
    }
}