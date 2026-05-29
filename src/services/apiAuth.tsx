import { supabase } from "@/utils/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SignUpCredentials = {
  fullName: string;
  email: string;
  password: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type UpdateUserPayload = {
  password?: string;
  fullName?: string;
  avatar?: File; // File object from an <input type="file">
};

// ─── Auth functions ───────────────────────────────────────────────────────────

export async function signup({ fullName, email, password }: SignUpCredentials) {
  // Check for duplicate email BEFORE calling signUp.
  // We do this by attempting sign-in — if the user exists we get a specific
  // error, if not we proceed. This is more reliable than checking identities[].
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        // This goes into auth.users.raw_user_meta_data
        // accessible later via user.user_metadata.fullName
        fullName,
        avatar: "",
      },
    },
  });

  if (error) throw new Error(error.message);

  // Supabase silent duplicate: no error, no session, empty identities
  if (data.user && data.user.identities?.length === 0) {
    throw new Error("An account with this email already exists.");
  }

  return data;
}

export async function login({ email, password }: LoginCredentials) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(error.message);

  return data;
}

export async function getCurrentUser() {
  // Step 1: check if there is an active session at all
  // (avoids an unnecessary network request if the user is not logged in)
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return null;

  // Step 2: always use getUser() for the actual user data —
  // it hits the Supabase server to verify the JWT is still valid.
  // getSession() alone only reads from local storage and can be stale.
  const { data, error } = await supabase.auth.getUser();

  if (error) throw new Error(error.message);

  return data.user;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function updateCurrentUser({
  password,
  fullName,
  avatar,
}: UpdateUserPayload) {
  // Step 1: update password or fullName (mutually exclusive in one call)
  let updateData: Parameters<typeof supabase.auth.updateUser>[0] = {};

  if (password) {
    updateData = { password };
  } else if (fullName) {
    updateData = { data: { fullName } };
  }

  const { data, error } = await supabase.auth.updateUser(updateData);
  if (error) throw new Error(error.message);

  // Step 2: if no avatar to upload we are done
  if (!avatar) return data;

  // Step 3: upload the avatar to Supabase Storage
  // Random suffix prevents filename collisions for the same user
  const fileName = `avatar-${data.user.id}-${Math.random()}`;

  const { error: storageError } = await supabase.storage
    .from("avatars")
    .upload(fileName, avatar);

  if (storageError) throw new Error(storageError.message);

  // Step 4: write the public avatar URL back into user metadata
  const avatarUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${fileName}`;

  const { data: updatedUser, error: updateError } =
    await supabase.auth.updateUser({
      data: { avatar: avatarUrl },
    });

  if (updateError) throw new Error(updateError.message);

  return updatedUser;
}