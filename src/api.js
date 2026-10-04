const API_BASE_URL =
  "http://127.0.0.1:5000/api";


export function getStoredUser() {
  const localUser = localStorage.getItem(
    "currentUser"
  );

  if (localUser) {
    try {
      return JSON.parse(
        localUser
      );

    } catch {
      localStorage.removeItem(
        "currentUser"
      );
    }
  }

  const sessionUser = sessionStorage.getItem(
    "currentUser"
  );

  if (sessionUser) {
    try {
      return JSON.parse(
        sessionUser
      );

    } catch {
      sessionStorage.removeItem(
        "currentUser"
      );
    }
  }

  return null;
}


export function getAccessToken() {
  return (
    localStorage.getItem(
      "accessToken"
    ) ||
    sessionStorage.getItem(
      "accessToken"
    )
  );
}


export function storeAuthentication(
  user,
  accessToken,
  rememberMe
) {
  const userJson = JSON.stringify(
    user
  );

  if (rememberMe) {
    localStorage.setItem(
      "currentUser",
      userJson
    );

    localStorage.setItem(
      "accessToken",
      accessToken
    );

    sessionStorage.removeItem(
      "currentUser"
    );

    sessionStorage.removeItem(
      "accessToken"
    );

  } else {
    sessionStorage.setItem(
      "currentUser",
      userJson
    );

    sessionStorage.setItem(
      "accessToken",
      accessToken
    );

    localStorage.removeItem(
      "currentUser"
    );

    localStorage.removeItem(
      "accessToken"
    );
  }
}


export function clearStoredUser() {
  localStorage.removeItem(
    "currentUser"
  );

  localStorage.removeItem(
    "accessToken"
  );

  sessionStorage.removeItem(
    "currentUser"
  );

  sessionStorage.removeItem(
    "accessToken"
  );
}


export async function apiRequest(
  endpoint,
  options = {}
) {
  const accessToken =
    getAccessToken();

  const user =
    getStoredUser();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (accessToken) {
    headers.Authorization =
      `Bearer ${accessToken}`;
  }

  if (
    !accessToken &&
    user?.user_id
  ) {
    headers["X-User-Id"] = String(
      user.user_id
    );
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers
    }
  );

  const contentType =
    response.headers.get(
      "content-type"
    );

  const body =
    contentType &&
    contentType.includes(
      "application/json"
    )
      ? await response.json()
      : await response.text();

  if (response.status === 401) {
    clearStoredUser();

    window.dispatchEvent(
      new Event("auth-expired")
    );

    throw new Error(
      body?.error ||
      "Your session has expired. Please log in again."
    );
  }

  if (!response.ok) {
    throw new Error(
      body?.error ||
      body?.message ||
      "The server returned an unexpected response."
    );
  }

  return body;
}