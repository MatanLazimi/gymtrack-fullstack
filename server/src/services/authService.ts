import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../middleware/errorHandler.js';
import { UserModel } from '../models/User.js';
import type { Credentials } from '../validators/authValidators.js';

const SALT_ROUNDS = 12;
const TOKEN_TTL = '7d';

export interface AuthResult {
  token: string;
  user: { id: string; email: string };
}

export async function registerUser({ email, password }: Credentials): Promise<AuthResult> {
  const existing = await UserModel.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await UserModel.create({ email, passwordHash });

  return buildAuthResult(user.id, user.email);
}

export async function loginUser({ email, password }: Credentials): Promise<AuthResult> {
  const user = await UserModel.findOne({ email });
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new ApiError(401, 'Invalid email or password');
  }

  return buildAuthResult(user.id, user.email);
}

function buildAuthResult(id: string, email: string): AuthResult {
  const token = jwt.sign({ sub: id }, env.jwtSecret, { expiresIn: TOKEN_TTL });
  return { token, user: { id, email } };
}

export interface TokenPayload {
  sub: string;
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwtSecret) as TokenPayload;
}
