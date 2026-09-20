export type User = {
  id: string;
  email: string;
  balance: string;
};

export type LoginResponse = {
  accessToken: string;
};

export type RegisterResponse = {
  id: string;
  email: string;
};
