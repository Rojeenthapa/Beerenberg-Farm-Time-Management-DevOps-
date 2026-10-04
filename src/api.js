const API_BASE_URL = "http://127.0.0.1:5000/api";


export function getStoredUser() {
  const localUser = localStorage.getItem(
    "currentUser"
  );

  if (localUser) {
    try {
      return JSON.parse(localUser);

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
      return JSON.parse(sessionUser);

    } catch {
      sessionStorage.removeItem(
        "currentUser"
      );
    }
  }

  return null;
}


export function clearStoredUser() {
  localStorage.removeItem(
    "currentUser"
  );

  sessionStorage.removeItem(
    "currentUser"
  );
}


export async function apiRequest(
  endpoint,
  options = {}
) {
  const user = getStoredUser();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (user?.user_id) {
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

  const contentType = response.headers.get(
    "content-type"
  );

  const body = contentType?.includes(
    "application/json"
  )
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(
      body?.error ||
      body?.message ||
      "The server returned an unexpected response."
    );
  }

  return body;
}