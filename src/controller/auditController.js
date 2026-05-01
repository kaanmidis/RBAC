import {pool} from '../models/db.js';

export const getAuditLogs = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        al.id,
        al.created_at,
        al.action,
        al.entity,
        al.description,
        al.ip_address,

        u.email AS actor_email,
        a.id AS target_user_id,
        a.email AS target_user_email

      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      LEFT JOIN users a 
        ON al.entity_id = a.id 
       AND al.entity = 'USER'

      ORDER BY al.created_at DESC
      LIMIT 100
    `);

    res.render('auditLogs', { logs: result.rows });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).send('Audit log hatası');
  }
};
