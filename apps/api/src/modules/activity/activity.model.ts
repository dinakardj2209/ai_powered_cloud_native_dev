import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IActivity extends Document {
  projectId: Types.ObjectId;
  userId?: Types.ObjectId;
  userName: string;
  action: string;
  detail: string;
  createdAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String, required: true },
    action: { type: String, required: true },
    detail: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

activitySchema.index({ projectId: 1, createdAt: -1 });

export const Activity = mongoose.model<IActivity>('Activity', activitySchema);
