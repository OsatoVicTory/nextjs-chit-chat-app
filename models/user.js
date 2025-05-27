// models/Item.js
import mongoose from 'mongoose';

const ChitChatUserSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },
  lastSeen: {
    type: String,
  },
  socketId: {
    type: String,
  },
  user_id: {
    type: String,
    required: true,
  },
});

export default mongoose.models.ChitChatUser || mongoose.model('ChitChatUser', ChitChatUserSchema);