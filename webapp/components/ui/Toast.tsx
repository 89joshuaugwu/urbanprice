// Thin wrapper around react-hot-toast so the rest of the app imports one
// consistent "Toast" surface (per DESIGN.md's atom list) instead of
// reaching for the library directly everywhere.
import toast from "react-hot-toast";

export const Toast = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast(message),
};
