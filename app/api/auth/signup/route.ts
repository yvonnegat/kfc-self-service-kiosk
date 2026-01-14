import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';
import { signupSchema } from '@/lib/validation';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = signupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid input',
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { username, password, role } = validation.data;

    // Check if username already exists
    const [existingUsers] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Username already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Insert new user
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      [username, password_hash, role]
    );

    const newUserId = result.insertId;

    // Generate JWT token for immediate login
    const token = generateToken({
      id: newUserId,
      username: username,
      role: role,
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      data: {
        token,
        user: {
          id: newUserId,
          username: username,
          role: role,
        },
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create account' },
      { status: 500 }
    );
  }
}