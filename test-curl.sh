PORT=3000 node server.js &
SERVER_PID=$!
sleep 3
echo "Sending curl request..."
curl -v -X POST http://localhost:3000/api/auth/register \
-H "Content-Type: application/json" \
-H "Origin: http://localhost:5173" \
-d '{"name": "testuser", "email": "curltest1@test.com", "password": "password123", "role": "listener"}'
echo -e "\nCurl exit code: $?"
kill $SERVER_PID
