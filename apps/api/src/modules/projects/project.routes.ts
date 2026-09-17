import { Router } from 'express';
import { createProjectSchema, updateProjectSchema, paginationSchema } from '@devflow/shared';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import * as projectController from './project.controller';

const router = Router();

router.use(authenticate);

router.post('/', validate(createProjectSchema), projectController.createProject);
router.get('/', validate(paginationSchema, 'query'), projectController.getProjects);
router.get('/:id', projectController.getProject);
router.get('/:id/stats', projectController.getProjectStats);
router.patch('/:id', validate(updateProjectSchema), projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

export default router;
