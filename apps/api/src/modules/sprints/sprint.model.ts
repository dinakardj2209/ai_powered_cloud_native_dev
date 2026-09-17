import mongoose, { Document, Schema, Types } from 'mongoose';
import { SprintStatus } from '@devflow/shared';

export interface ISprint extends Document {
  projectId: Types.ObjectId;
  name: string;
  goal: string;
  status: SprintStatus;
  startDate: Date;
  endDate: Date;
}

const sprintSchema = new Schema<ISprint>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    name: { type: String, required: true },
    goal: { type: String, default: '' },
    status: {
      type: String,
      enum: Object.values(SprintStatus),
      default: SprintStatus.ACTIVE,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { timestamps: true },
);

export const Sprint = mongoose.model<ISprint>('Sprint', sprintSchema);
