import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IChatMessage extends Document {
  projectId: Types.ObjectId;
  userId: Types.ObjectId;
  userName: string;
  content: string;
  createdAt: Date;
}

const chatSchema = new Schema<IChatMessage>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    content: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

chatSchema.index({ projectId: 1, createdAt: -1 });

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', chatSchema);
