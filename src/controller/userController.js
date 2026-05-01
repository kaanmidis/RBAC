import {pool} from '../models/db.js';

export const listUser = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.id,
                u.email,
                u.is_active,
                r.name AS role
            FROM users u
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.id
            ORDER BY u.id
        `);
        await pool.query(
            `INSERT INTO audit_logs (user_id,action,entity,description,ip_address) VALUES ($1,$2,$3,$4,$5)`,
            [req.session.user.id, 'VIEW_USERS', 'USER', 'Kullanıcı listesi görüntülendi', req.ip]
        )

        res.render('userList', { users: result.rows });
    } catch (error) {
        console.error('Kullanıcı listesi görüntülenirken hata oluştu:', error);
    }
}

export const disableUser = async (req, res) => {
    const userId = req.params.id;
    const actorId = req.session.user.id;

    const client = await pool.connect(); 

    try {
        if (actorId.toString() === userId) {
            return res.status(400).send('Kendi hesabınızı devre dışı bırakamazsınız.');
        }

        await client.query('BEGIN'); 

        const { rows } = await client.query(
            `SELECT u.id, u.is_active, r.name AS role FROM users u 
             LEFT JOIN user_roles ur ON u.id = ur.user_id 
             LEFT JOIN roles r ON ur.role_id = r.id 
             WHERE u.id IN ($1, $2)`, 
            [userId, actorId]
        );

        const targetUser = rows.find(r => r.id == userId);
        const actorUser = rows.find(r => r.id == actorId);

        if (!targetUser) {
            await client.query('ROLLBACK');
            return res.status(404).send('Kullanıcı bulunamadı.');
        }

        if (targetUser.role === 'OWNER' || (actorUser.role !== 'OWNER' && targetUser.role === 'ADMIN')) {
            await client.query(
                `INSERT INTO audit_logs (user_id, action, entity, entity_id, description, ip_address) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [actorId, 'UNAUTHORIZED_ACCESS_ATTEMPT', 'USER', userId, 'Yetkisiz işlem denemesi', req.ip]
            );
            await client.query('COMMIT'); 
            return res.status(403).send('Bu kullanıcıya işlem yapma yetkiniz yok.');
        }

        const newStatus = !targetUser.is_active;
        const action = newStatus ? 'ENABLE_USER' : 'DISABLE_USER';

        await client.query('UPDATE users SET is_active = $1 WHERE id = $2', [newStatus, userId]);

        await client.query(
            `INSERT INTO audit_logs (user_id, action, entity, entity_id, description, ip_address) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [actorId, action, 'USER', userId, `Durum değiştirildi: ${newStatus}`, req.ip]
        );

        await client.query('COMMIT'); 
        res.redirect('/user');

    } catch (error) {
        await client.query('ROLLBACK'); 
        console.error('Hata:', error);
        res.status(500).send('Sunucu hatası.');
    } finally {
        client.release();
    }
};

export const showRoleManagement = async (req, res) => {
    const userId = req.params.id;
    const actorId = req.session.user.id;
    try {

        const { rows } = await pool.query(
            `SELECT
                u.id, u.email, r.name AS role, u.is_active
             FROM users u
             LEFT JOIN user_roles ur ON u.id = ur.user_id 
             LEFT JOIN roles r ON ur.role_id = r.id 
             WHERE u.id IN ($1, $2)`, 
            [userId, actorId]
        );

        const allRolesResult = await pool.query('SELECT id, name FROM roles');

        const targetUser = rows.find(r => r.id == userId); // işlem yapuılan kullanıcı
        const actorUser = rows.find(r => r.id == actorId); // işlemi yapan kullanıcı

        if (!targetUser) {
            return res.status(404).send('Kullanıcı bulunamadı.');
        }

        if (targetUser.id === actorId) {
            return res.status(400).send('Kendi rolünüzü yönetemezsiniz.');
        };

        if (targetUser.role === 'OWNER' || (actorUser.role !== 'OWNER' && targetUser.role === 'ADMIN')) {
            await pool.query(
                `INSERT INTO audit_logs (user_id, action, entity, entity_id, description, ip_address) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [actorId, 'UNAUTHORIZED_ACCESS_ATTEMPT', 'USER', userId, 'Yetkisiz rol yönetimi denemesi', req.ip]
            );
            return res.status(403).send('Bu kullanıcıya işlem yapma yetkiniz yok.');
        }

        res.render('roleManagement', { result: targetUser, allRoles: allRolesResult.rows });

    } catch (error) {
        console.error('Rol yönetimi sayfası görüntülenirken hata oluştu:', error);
        res.status(500).send('Sunucu hatası.');
    }
}

export const updateUserRole = async (req, res) => {
  const userId = Number(req.params.id);
  const newRoleName = req.body.role_name;
  const actorId = Number(req.session?.user?.id);

  if (!actorId) {
    return res.status(401).send('Yetkisiz erişim');
  }

  const ROLE_LEVEL = {
    OWNER: 100,
    ADMIN: 50,
    AUDITOR: 20,
    USER: 10
  };

  if (!ROLE_LEVEL[newRoleName]) {
    return res.status(400).send('Geçersiz rol');
  }

  const client = await pool.connect();

  try {
    const { rows } = await client.query(
      `
      SELECT u.id, r.name AS role
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id IN ($1, $2)
      `,
      [userId, actorId]
    );

    const targetUser = rows.find(r => r.id === userId);
    const actorUser  = rows.find(r => r.id === actorId);

    if (!targetUser) {
      return res.status(404).send('Kullanıcı bulunamadı');
    }

    if (actorId === userId) {
      return res.status(400).send('Kendi rolünüzü değiştiremezsiniz');
    }

    const actorLevel  = ROLE_LEVEL[actorUser.role];
    const targetLevel = ROLE_LEVEL[targetUser.role];
    const newLevel    = ROLE_LEVEL[newRoleName];

    if (
      targetLevel >= actorLevel ||
      newLevel    >= actorLevel
    ) {
      await client.query(
        `
        INSERT INTO audit_logs (user_id, action, entity, entity_id, description, ip_address)
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          actorId,
          'UNAUTHORIZED_ACCESS_ATTEMPT',
          'USER',
          userId,
          `Yetkisiz rol atama denemesi (${targetUser.role} → ${newRoleName})`,
          req.ip
        ]
      );

      return res.status(403).send('Bu işlem için yetkiniz yok');
    }

    if (targetUser.role === 'OWNER') {
      return res.status(403).send('Owner rolü değiştirilemez');
    }

    await client.query('BEGIN');

    const roleResult = await client.query(
      'SELECT id FROM roles WHERE name = $1',
      [newRoleName]
    );

    if (roleResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).send('Geçersiz rol');
    }

    const newRoleId = roleResult.rows[0].id;

    await client.query(
      `
        UPDATE user_roles SET role_id = $1 WHERE user_id = $2
      `,
      [newRoleId, userId]
    );

    await client.query(
      `
      INSERT INTO audit_logs (user_id, action, entity, entity_id, description, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        actorId,
        'ROLE_CHANGE',
        'USER',
        userId,
        `Rol değiştirildi: ${targetUser.role} → ${newRoleName}`,
        req.ip
      ]
    );

    await client.query('COMMIT');
    res.redirect(`/user/role/${userId}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Rol güncelleme hatası:', error);
    res.status(500).send('Sunucu hatası');
  } finally {
    client.release();
  }
};
