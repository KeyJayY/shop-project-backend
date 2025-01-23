import express from 'express';
import bcrypt from 'bcryptjs';
import * as databaseFunctions from '../services/databaseService.js';
import { generateToken, verifyAdminToken } from '../middleware/authMiddleware.js';

const router = express.Router();