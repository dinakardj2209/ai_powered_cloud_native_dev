import { Router } from 'express';
import { createTaskSchema, updateTaskSchema, paginationSchema } from '@devflow/shared';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import * as taskController from './task.controller';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.post('/', validate(createTaskSchema), taskController.createTask);
router.get('/', validate(paginationSchema, 'query'), taskController.getTasks);
router.get('/board', taskController.getKanbanBoard);
router.get('/:taskId', taskController.getTask);
router.patch('/:taskId', validate(updateTaskSchema), taskController.updateTask);
router.delete('/:taskId', taskController.deleteTask);

export default router;
