import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcryptjs";
import { PrismaService } from "../prisma.service.ts";

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string) {
    const users = await this.prisma.db.orm.public.User
      .select("id", "email", "name", "password", "role")
      .all();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return null;
    }

    const isMatch = bcrypt.compareSync(pass, user.password);
    if (!isMatch) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  async login(credentials: { email: string; password: string }) {
    if (!credentials.email || !credentials.password) {
      throw new BadRequestException("Email and password are required");
    }

    const user = await this.validateUser(credentials.email, credentials.password);
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const payload = { sub: user.id, email: user.email, role: user.role, name: user.name };
    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  verifyToken(token: string) {
    return this.jwtService.verify(token);
  }

  async getProfile(userId: number) {
    const users = await this.prisma.db.orm.public.User
      .select("id", "email", "name", "role", "createdAt")
      .all();
    const user = users.find((u) => u.id === userId);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    return user;
  }

  async changePassword(userId: number, oldPass: string, newPass: string) {
    if (!newPass || newPass.length < 6) {
      throw new BadRequestException("New password must be at least 6 characters");
    }

    const users = await this.prisma.db.orm.public.User
      .select("id", "password")
      .all();
    const user = users.find((u) => u.id === userId);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const isMatch = bcrypt.compareSync(oldPass, user.password);
    if (!isMatch) {
      throw new BadRequestException("Current password is incorrect");
    }

    const hashed = bcrypt.hashSync(newPass, 10);
    await this.prisma.db.orm.public.User
      .where({ id: userId })
      .update({ password: hashed });

    return { success: true, message: "Password updated successfully" };
  }
}
