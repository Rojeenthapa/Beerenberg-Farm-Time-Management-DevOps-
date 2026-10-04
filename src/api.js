const API_URL = "/api";

function getStoredUser() {
  const localUser =
    localStorage.getItem("currentUser");

  if (localUser) {
    return JSON.parse(localUser);
  }

  const sessionUser =
    sessionStorage.getItem("currentUser");

  if (sessionUser) {
    return JSON.parse(sessionUser);
  }

  return null;
}

async function apiRequest(
  path,
  options = {}
) {
  const user = getStoredUser();

  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...(options.headers || {})
  };

  if (user?.user_id) {
    headers["X-User-Id"] = String(
      user.user_id
    );
  }

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers
    }
  );

  const contentType =
    response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error(
      "The server returned an unexpected response."
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Request failed."
    );
  }

  return data;
}

export {
  API_URL,
  apiRequest,
  getStoredUser
};