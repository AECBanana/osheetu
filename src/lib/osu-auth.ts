const OSU_CLIENT_ID = process.env.OSU_CLIENT_ID ?? "";
const OSU_CLIENT_SECRET = process.env.OSU_CLIENT_SECRET ?? "";

const resolveOsuRedirectUri = () => {
  if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") {
    const baseUrl =
      process.env.OSU_REDIRECT_URI ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.NEXTAUTH_URL);
    if (baseUrl) {
      return baseUrl;
    }
  }
  return process.env.OSU_REDIRECT_URI || "http://localhost:3000/api/auth/callback";
};

const OSU_REDIRECT_URI = resolveOsuRedirectUri();

export const getOsuAuthUrl = () => {
  if (!OSU_CLIENT_ID) {
    throw new Error("OSU_CLIENT_ID is not configured. Please set the OSU_CLIENT_ID environment variable.");
  }

  if (!OSU_CLIENT_SECRET) {
    console.warn(
      "OSU_CLIENT_SECRET is not configured. Token exchange requests are expected to fail without it.",
    );
  }

  const params = new URLSearchParams({
    client_id: OSU_CLIENT_ID,
    redirect_uri: OSU_REDIRECT_URI,
    response_type: "code",
    scope: "identify public",
  });

  return `https://osu.ppy.sh/oauth/authorize?${params.toString()}`;
};

export const getOsuToken = async (
  code: string,
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> => {
  const response = await fetch("https://osu.ppy.sh/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: OSU_CLIENT_ID,
      client_secret: OSU_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: OSU_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get access token: ${response.status} - ${errorText}`);
  }

  return response.json();
};

export const getOsuUserInfo = async (
  accessToken: string,
): Promise<{
  id: number;
  username: string;
  avatar_url: string;
  country_code: string;
  cover?: {
    custom_url: string | null;
    url: string;
    id: string | null;
  };
  statistics?: {
    pp: number;
    global_rank: number | null;
    country_rank: number | null;
    country: string;
  };
}> => {
  const response = await fetch("https://osu.ppy.sh/api/v2/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get user info");
  }

  const userData = await response.json();

  return {
    id: userData.id,
    username: userData.username,
    avatar_url: userData.avatar_url,
    country_code: userData.country_code,
    cover: userData.cover
      ? {
          custom_url: userData.cover.custom_url || null,
          url: userData.cover.url || "",
          id: userData.cover.id || null,
        }
      : undefined,
    statistics: userData.statistics
      ? {
          pp: userData.statistics.pp,
          global_rank: userData.statistics.global_rank,
          country_rank: userData.statistics.country_rank,
          country: userData.country_code || "",
        }
      : undefined,
  };
};

export const verifyOsuToken = async (accessToken: string) => {
  try {
    const response = await fetch("https://osu.ppy.sh/api/v2/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
};

export const getOsuClientToken = async (): Promise<{
  access_token: string;
  expires_in: number;
  token_type: string;
}> => {
  if (!OSU_CLIENT_ID || !OSU_CLIENT_SECRET) {
    throw new Error("OSU_CLIENT_ID and OSU_CLIENT_SECRET must be configured");
  }

  const response = await fetch("https://osu.ppy.sh/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: OSU_CLIENT_ID,
      client_secret: OSU_CLIENT_SECRET,
      grant_type: "client_credentials",
      scope: "public",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get client token: ${response.status} ${errorText}`);
  }

  return response.json();
};

let cachedClientToken: { token: string; expires: number } | null = null;

export const getValidClientToken = async () => {
  const now = Date.now() / 1000;

  if (cachedClientToken && cachedClientToken.expires > now + 60) {
    return cachedClientToken.token;
  }

  const tokenData = await getOsuClientToken();
  cachedClientToken = {
    token: tokenData.access_token,
    expires: now + tokenData.expires_in,
  };

  return cachedClientToken.token;
};
