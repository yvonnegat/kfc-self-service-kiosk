// lib/auth-edge.ts
import { jwtVerify } from 'jose';

export async function verifyToken(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    return payload as {
      id: number;
      username: string;
      role: string;
    };
  } catch (error) {
    console.error('❌ EDGE TOKEN VERIFY FAILED', error);
    return null;
  }
}
