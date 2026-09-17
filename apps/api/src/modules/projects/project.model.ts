import mongoose, { Document, Schema, Types } from 'mongoose';
import { ProjectTechStack, ProjectStatus, UserRole } from '@devflow/shared';

export interface IProjectMember {
  userId: Types.ObjectId;
  role: UserRole;
  joinedAt: Date;
}

export interface IProject extends Document {
  name: string;
  description: string;
  techStack: ProjectTechStack;
  status: ProjectStatus;
  ownerId: Types.ObjectId;
  members: IProjectMember[];
  githubRepoUrl?: string;
  githubRepoName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const projectMemberSchema = new Schema<IProjectMember>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: Object.values(UserRole), required: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const projectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    techStack: {
      type: String,
      enum: Object.values(ProjectTechStack),
      default: ProjectTechStack.MERN,
    },
    status: {
      type: String,
      enum: Object.values(ProjectStatus),
      default: ProjectStatus.ACTIVE,
    },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [projectMemberSchema],
    githubRepoUrl: String,
    githubRepoName: String,
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

projectSchema.index({ ownerId: 1 });
projectSchema.index({ 'members.userId': 1 });
projectSchema.index({ status: 1 });

export const Project = mongoose.model<IProject>('Project', projectSchema);
