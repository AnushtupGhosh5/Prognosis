console.log('API_BASE_URL:', process.env.NEXT_PUBLIC_API_BASE_URL);

// Test URL construction
const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
console.log('Base URL:', apiUrl);
console.log('Sessions URL:', `${apiUrl}/api/sessions`);
console.log('Auth URL:', `${apiUrl}/api/auth/login`);

// Check for double slashes
const sessionsUrl = `${apiUrl}/api/sessions`;
if (sessionsUrl.includes('//api/')) {
  console.error('Double slash detected!', sessionsUrl);
} else {
  console.log('URL looks good:', sessionsUrl);
}