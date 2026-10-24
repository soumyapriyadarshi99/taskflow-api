// modules/auth/auth.service.ts — Business logic + DB calls for auth. Hash, JWT, rotation live here.
export class AuthService {
  public login = async (email: string, password: string) => {
    if (!email || !password) {
      throw new Error("Email and password are required");
    }
  };
  public register = async (email: string, password: string) => {
    if (!email || !password) {
      throw new Error("Email and password are required");
    }
  };
}
