import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_Y7x2ELoURONM@ep-ancient-term-aghunmrs-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});