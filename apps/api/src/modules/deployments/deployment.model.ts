import mongoose, { Document, Schema, Types } from 'mongoose';

export type DeploymentStatus = 'SUCCESS' | 'FAILED' | 'RUNNING' | 'CANCELLED';

export interface IPipelineStep {
  name: string;
  status: 'success' | 'failed' | 'running' | 'pending' | 'skipped';
  durationMs: number;
}

export interface IDeployment extends Document {
  projectId: Types.ObjectId;
  number: number;
  status: DeploymentStatus;
  commitSha: string;
  commitMessage: string;
  branch: string;
  environment: 'production' | 'staging';
  triggeredBy: string;
  steps: IPipelineStep[];
  startedAt: Date;
  finishedAt?: Date;
  url?: string;
}

const deploymentSchema = new Schema<IDeployment>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    number: { type: Number, required: true },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED', 'RUNNING', 'CANCELLED'],
      required: true,
    },
    commitSha: String,
    commitMessage: String,
    branch: { type: String, default: 'main' },
    environment: { type: String, enum: ['production', 'staging'], default: 'production' },
    triggeredBy: String,
    steps: [
      {
        name: String,
        status: String,
        durationMs: Number,
      },
    ],
    startedAt: { type: Date, default: Date.now },
    finishedAt: Date,
    url: String,
  },
  { timestamps: true },
);

deploymentSchema.index({ projectId: 1, number: -1 });

export const Deployment = mongoose.model<IDeployment>('Deployment', deploymentSchema);
