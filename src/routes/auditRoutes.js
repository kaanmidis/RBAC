import express from 'express';
import {checkPermission} from '../middlewares/checkPermission.js';
import { getAuditLogs } from '../controller/auditController.js';

const router = express.Router();    

router.get('/audit-logs', checkPermission('AUIDIT_VİEW'), getAuditLogs);

export default router;