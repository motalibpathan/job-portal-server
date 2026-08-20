import mongoose, { HydratedDocument, Schema } from "mongoose";

interface IFacebookError {
  code?: number;
  message?: string;
  subcode?: number;
}

const facebookErrorSchema = new Schema<IFacebookError>({
  code: { type: Number },
  message: { type: String },
  subcode: { type: Number },
});

export interface IFacebookUser {
  facebookId: string;
  facebookName?: string;
  // must be long live access token
  accessToken: string;
  // undefined if never expires
  tokenExpiresAt?: Date;
  tokenIssuedAt?: Date;
  tokenLastUpdate?: Date;
  isTokenValid?: boolean;
  tokenScopes?: string[];
  hasTokenRequiredScopes?: boolean;
  facebookError?: IFacebookError;
}

// facebook schema
const userFacebookSchema = new Schema<IFacebookUser>({
  facebookId: {
    type: String,
    trim: true,
    unique: true,
    index: true,
    sparse: true,
    required: false,
  },
  facebookName: {
    type: String,
  },
  // token info
  accessToken: {
    type: String,
  },
  // undefined - token never expires
  tokenExpiresAt: {
    type: Date,
  },
  tokenIssuedAt: {
    type: Date,
  },
  tokenLastUpdate: {
    type: Date,
  },
  isTokenValid: {
    type: Boolean,
    default: true,
  },
  tokenScopes: {
    type: [String],
    default: [],
  },
  hasTokenRequiredScopes: {
    type: Boolean,
  },
  facebookError: { type: facebookErrorSchema },
});

interface IGoogleUser {
  googleId: string;
  googleEmail: string;
  googleName?: string;
}

// google schema
const userGoogleSchema = new Schema<IGoogleUser>({
  googleId: {
    type: String,
  },
  googleEmail: {
    type: String,
    trim: true,
    unique: true,
    index: true,
    sparse: true,
    required: false,
  },
  googleName: {
    type: String,
  },
});

export interface IUserModel {
  name?: string;

  email?: string;
  isEmailVerified?: boolean;
  phoneNumber?: string;
  isPhoneNumberVerified?: boolean;

  profilePicture?: string;
  password?: string;

  google?: IGoogleUser;

  facebook?: IFacebookUser;

  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserModel>(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      unique: true,
      index: true,
      sparse: true,
      required: false,
    },
    isEmailVerified: {
      type: Boolean,
    },
    phoneNumber: {
      type: String,
      trim: true,
      unique: true,
      index: true,
      sparse: true,
      required: false,
    },
    isPhoneNumberVerified: {
      type: Boolean,
    },
    profilePicture: {
      type: String,
    },

    password: {
      type: String,
    },

    // google
    google: userGoogleSchema,

    // facebook
    facebook: userFacebookSchema,
  },
  { timestamps: true },
);

userSchema.index({ phoneNumber: 1 }, { sparse: true, unique: true });
userSchema.index({ email: 1 }, { sparse: true, unique: true });
userSchema.index({ "facebook.facebookId": 1 }, { sparse: true, unique: true });
userSchema.index({ "google.googleEmail": 1 }, { sparse: true, unique: true });

export type IUserDocument = HydratedDocument<IUserModel>;

const User = mongoose.model<IUserModel>("users", userSchema);

export default User;
