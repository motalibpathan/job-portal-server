import mongoose, { HydratedDocument } from "mongoose";
const Schema = mongoose.Schema;


const AdminSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    unique: true,
    required: true,
  },
  phone: {
    type: String,
  },
  email: {
    type: String,
  },
  avatar: {
    type: String,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  level: {
    type: Number,
    required: true,
  },
});

export interface IAdminModel {
  name: string;
  username: string;
  phone: string;
  email?: string;
  avatar?: string;
  isVerified: boolean;
  password: string;
  level: number;
}
export type IAdminDocument = HydratedDocument<IAdminModel>;

const Admin = mongoose.model<IAdminDocument>("admins", AdminSchema);

export default Admin;
