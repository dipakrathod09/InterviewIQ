import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export const registerUser = async (userData) => {
  const { name, email, password } = userData;

  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new ApiError(409, 'User already exists', 'CONFLICT');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    passwordHash,
  });

  if (!user) {
    throw new ApiError(400, 'Invalid user data');
  }

  return generateTokenAndUserResponse(user);
};

export const loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select('+passwordHash');

  if (user && (await bcrypt.compare(password, user.passwordHash))) {
    return generateTokenAndUserResponse(user);
  } else {
    throw new ApiError(401, 'Invalid email or password');
  }
};

const generateTokenAndUserResponse = (user) => {
  const token = jwt.sign({ id: user._id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    targetRole: user.targetRole,
    experienceLevel: user.experienceLevel,
    techStack: user.techStack,
    token,
  };
};
