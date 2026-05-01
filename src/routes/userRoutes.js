import express from "express";
import { checkPermission } from '../middlewares/checkPermission.js';
import { listUser, disableUser, showRoleManagement, updateUserRole } from "../controller/userController.js";
const router = express.Router();

router.get('/', checkPermission('USER_VIEW'), listUser);
router.post('/disable/:id',checkPermission('USER_DISABLE'), disableUser);
router.get('/role/:id',checkPermission('ROLE_ASSIGN'),showRoleManagement);
router.post('/:id/change-role',checkPermission('ROLE_ASSIGN'),updateUserRole);
export default router;