import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service.ts";
import { JwtAuthGuard } from "./jwt-auth.guard.ts";

@Controller("api/auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post("login")
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post("change-password")
  async changePassword(
    @Request() req: any,
    @Body() body: { oldPass: string; newPass: string },
  ) {
    return this.authService.changePassword(req.user.sub, body.oldPass, body.newPass);
  }
}

