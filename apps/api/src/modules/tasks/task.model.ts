import mongoose, { Document, Schema, Types } from 'mongoose';
import { TaskStatus } from '@devflow/shared';

export interface ITask extends Document {
  projectId: Types.ObjectId;
  title: string;
  description: string;
  status: TaskStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assigneeId?: Types.ObjectId;
  createdById: Types.ObjectId;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.TODO,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User' },
    createdById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tags: [{ type: String }],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ assigneeId: 1 });
taskSchema.index({ createdById: 1 });

export const Task = mongoose.model<ITask>('Task', taskSchema);
