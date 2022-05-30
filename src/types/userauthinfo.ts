import { User } from "./user";

export interface UserAuthinfo {
  errors: unknown;
  user: User;
  isAuthenticated: boolean;
}
